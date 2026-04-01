import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Badge from '../../components/ui/Badge';
import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import {
  LotMemberPayload,
  LotMemberRole,
  getLotMembers,
  inviteLotMember,
  restoreLotMember,
  revokeLotMember,
  updateLotMemberLimits,
  updateLotMemberRole,
} from '../../services/api';
import { useAuthStore } from '../../services/authStore';

type MemberFilter = 'all' | 'pending' | 'active' | 'revoked';

export default function MembersScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { refreshUser, user } = useAuthStore();
  const [members, setMembers] = useState<LotMemberPayload[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<LotMemberRole>('family');
  const [inviteLimit, setInviteLimit] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');

  const canManageMembers = !!user?.current_lot_member?.can_manage_members;

  useEffect(() => {
    if (canManageMembers) {
      void loadMembers();
    }
  }, [canManageMembers]);

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const res = await getLotMembers();
      setMembers(res.data.data);
    } catch (error: any) {
      Alert.alert('No pudimos cargar miembros', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail.trim()) {
      Alert.alert('Email requerido', 'Ingresa el email del familiar o invitado.');
      return;
    }

    setInviteLoading(true);
    try {
      await inviteLotMember({
        invited_email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        can_access_store: true,
        can_charge_expenses: inviteRole !== 'authorized',
        can_manage_members: false,
        spending_limit: inviteLimit.trim() ? Number(inviteLimit) : null,
      });

      setInviteEmail('');
      setInviteRole('family');
      setInviteLimit('');
      await loadMembers();
      await refreshUser();
      Alert.alert('Invitación creada', 'El miembro ya quedó asociado al lote con sus permisos iniciales.');
    } catch (error: any) {
      Alert.alert('No pudimos invitar', error?.response?.data?.error || 'Revisa los datos e intenta de nuevo.');
    } finally {
      setInviteLoading(false);
    }
  }

  function buildMemberInviteLink(token: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/invite/${encodeURIComponent(token)}`;
    }

    return `markethouse://invite/${encodeURIComponent(token)}`;
  }

  async function handleCopyInvite(member: LotMemberPayload) {
    if (!member.invitation_token) return;

    const inviteLink = buildMemberInviteLink(member.invitation_token);
    const inviteMessage = `Market House\nInvitación para ${member.invited_email}\n\nLink: ${inviteLink}`;

    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteMessage);
        Alert.alert('Invitación copiada', 'Copiamos el link listo para compartir.');
        return;
      }

      await Share.share({ message: inviteMessage, title: 'Invitación Market House' });
    } catch {
      Alert.alert('No pudimos copiar la invitación', 'Intenta usar la opción de compartir.');
    }
  }

  async function handleShareInvite(member: LotMemberPayload) {
    if (!member.invitation_token) return;

    const inviteLink = buildMemberInviteLink(member.invitation_token);
    const inviteMessage = `Te invitaron a Market House para operar en el lote.\n\nAbre este link:\n${inviteLink}`;

    try {
      await Share.share({ message: inviteMessage, title: 'Invitación Market House' });
    } catch {
      Alert.alert('No pudimos compartir la invitación', 'Puedes copiar el link manualmente.');
    }
  }

  async function handleWhatsAppInvite(member: LotMemberPayload) {
    if (!member.invitation_token) return;

    const inviteLink = buildMemberInviteLink(member.invitation_token);
    const inviteMessage = `Te invitaron a Market House para operar en el lote.\n\nAbre este link:\n${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

    try {
      if (Platform.OS === 'web') {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (!canOpen) throw new Error('WhatsApp no disponible');
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert('No pudimos abrir WhatsApp', 'Puedes usar “Reenviar” o “Copiar link”.');
    }
  }

  async function handleRevokeMember(member: LotMemberPayload) {
    const proceed = Platform.OS === 'web'
      ? window.confirm(`Se revocará el acceso de ${member.invited_email}.`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Revocar acceso', `Se revocará el acceso de ${member.invited_email}.`, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Revocar', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!proceed) return;

    setSavingMemberId(member.id);
    try {
      await revokeLotMember(member.id);
      await loadMembers();
      await refreshUser();
    } catch (error: any) {
      Alert.alert('No pudimos revocar el acceso', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleRestoreMember(member: LotMemberPayload) {
    setSavingMemberId(member.id);
    try {
      await restoreLotMember(member.id);
      await loadMembers();
      await refreshUser();
    } catch (error: any) {
      Alert.alert('No pudimos restaurar el acceso', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handleRoleChange(member: LotMemberPayload, role: LotMemberRole) {
    setSavingMemberId(member.id);
    try {
      const roleRes = await updateLotMemberRole(member.id, role);
      const updated = roleRes.data.data;
      await updateLotMemberLimits(member.id, {
        can_access_store: true,
        can_charge_expenses: updated.role !== 'authorized',
        can_manage_members: updated.role === 'owner',
        spending_limit: updated.spending_limit ?? null,
      });
      await loadMembers();
    } catch (error: any) {
      Alert.alert('No pudimos actualizar el rol', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setSavingMemberId(null);
    }
  }

  async function handlePermissionChange(member: LotMemberPayload, patch: Partial<LotMemberPayload>) {
    setSavingMemberId(member.id);
    try {
      await updateLotMemberLimits(member.id, {
        can_access_store: patch.can_access_store ?? member.can_access_store,
        can_charge_expenses: patch.can_charge_expenses ?? member.can_charge_expenses,
        can_manage_members: patch.can_manage_members ?? member.can_manage_members,
        spending_limit: patch.spending_limit ?? member.spending_limit ?? null,
      });
      await loadMembers();
    } catch (error: any) {
      Alert.alert('No pudimos guardar cambios', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setSavingMemberId(null);
    }
  }

  const filteredMembers = members.filter((member) => memberFilter === 'all' || member.status === memberFilter);
  const summary = useMemo(() => ({
    pending: members.filter((member) => member.status === 'pending').length,
    active: members.filter((member) => member.status === 'active').length,
    revoked: members.filter((member) => member.status === 'revoked').length,
    monthlySpend: members.reduce((sum, member) => sum + (member.monthly_spend ?? 0), 0),
  }), [members]);

  if (!canManageMembers) {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.wideCard}>
            <BrandMark align="center" size="sm" />
            <Text style={styles.sectionTitle}>Miembros del lote</Text>
            <Text style={styles.sectionCopy}>
              Solo el titular o un administrador con permisos puede agregar familiares, invitados y definir límites.
            </Text>
            <Button label="Volver al perfil" variant="outline" onPress={() => router.back()} />
          </Card>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={isWide && styles.wideCard}>
          <View style={styles.topRow}>
            <View style={styles.topCopy}>
              <BrandMark align="left" size="sm" subtitle="Autorizaciones, límites y estado de cada miembro del lote." />
            </View>
            <Button label="Volver" variant="outline" fullWidth={false} onPress={() => router.back()} />
          </View>

          <View style={styles.metricGrid}>
            <InfoStat label="Activos" value={String(summary.active)} />
            <InfoStat label="Pendientes" value={String(summary.pending)} />
            <InfoStat label="Revocados" value={String(summary.revoked)} />
            <InfoStat label="Consumo mes" value={formatCurrency(summary.monthlySpend)} />
          </View>
        </Card>

        <Card variant="elevated" style={[styles.manageCard, isWide && styles.wideCard]}>
          <Text style={styles.sectionTitle}>Agregar familiar o invitado</Text>
          <Text style={styles.sectionCopy}>
            Desde acá podés autorizar quién compra en tu lote, si puede cargar a expensas y cuánto puede gastar.
          </Text>
          <Input label="Email del miembro" value={inviteEmail} onChangeText={setInviteEmail} placeholder="persona@email.com" keyboardType="email-address" />

          <View style={styles.roleSelector}>
            {(['family', 'authorized'] as LotMemberRole[]).map((role) => {
              const selected = inviteRole === role;
              return (
                <TouchableOpacity key={role} style={[styles.roleChip, selected && styles.roleChipActive]} onPress={() => setInviteRole(role)}>
                  <Text style={[styles.roleChipText, selected && styles.roleChipTextActive]}>
                    {role === 'family' ? 'Familiar' : 'Invitado'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Límite de gasto"
            value={inviteLimit}
            onChangeText={setInviteLimit}
            placeholder="Ej: 15000"
            keyboardType="numeric"
            hint="Dejalo vacío si no querés fijar tope."
          />

          <Button label="Agregar miembro" onPress={() => void handleInviteMember()} loading={inviteLoading} />
        </Card>

        <Card style={isWide && styles.wideCard}>
          <View style={styles.memberHeader}>
            <Text style={styles.sectionTitle}>Familiares e invitados</Text>
            <TouchableOpacity onPress={() => void loadMembers()}>
              <Text style={styles.refreshText}>{loadingMembers ? 'Actualizando...' : 'Actualizar'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {(['all', 'pending', 'active', 'revoked'] as MemberFilter[]).map((filter) => {
              const selected = memberFilter === filter;
              const label = filter === 'all' ? 'Todos' : filter === 'pending' ? 'Pendientes' : filter === 'active' ? 'Activos' : 'Revocados';
              return (
                <TouchableOpacity key={filter} style={[styles.filterChip, selected && styles.filterChipActive]} onPress={() => setMemberFilter(filter)}>
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              loading={savingMemberId === member.id}
              onRoleChange={handleRoleChange}
              onPermissionChange={handlePermissionChange}
              onCopyInvite={handleCopyInvite}
              onShareInvite={handleShareInvite}
              onWhatsAppInvite={handleWhatsAppInvite}
              onRevoke={handleRevokeMember}
              onRestore={handleRestoreMember}
            />
          ))}

          {!loadingMembers && filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No hay miembros en este estado.</Text>
          ) : null}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

function MemberCard({
  member,
  loading,
  onRoleChange,
  onPermissionChange,
  onCopyInvite,
  onShareInvite,
  onWhatsAppInvite,
  onRevoke,
  onRestore,
}: {
  member: LotMemberPayload;
  loading: boolean;
  onRoleChange: (member: LotMemberPayload, role: LotMemberRole) => void;
  onPermissionChange: (member: LotMemberPayload, patch: Partial<LotMemberPayload>) => void;
  onCopyInvite: (member: LotMemberPayload) => void;
  onShareInvite: (member: LotMemberPayload) => void;
  onWhatsAppInvite: (member: LotMemberPayload) => void;
  onRevoke: (member: LotMemberPayload) => void;
  onRestore: (member: LotMemberPayload) => void;
}) {
  const [limitValue, setLimitValue] = useState(member.spending_limit?.toString() || '');
  const statusLabel =
    member.status === 'active' ? 'activo' : member.status === 'pending' ? 'pendiente' : 'revocado';
  const statusVariant =
    member.status === 'active' ? 'verified' : member.status === 'pending' ? 'pending' : 'unverified';
  const roleLabel =
    member.role === 'owner' ? 'Titular' : member.role === 'family' ? 'Familiar' : 'Invitado';

  useEffect(() => {
    setLimitValue(member.spending_limit?.toString() || '');
  }, [member.spending_limit]);

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberTop}>
        <View style={styles.memberIdentity}>
          <Text style={styles.memberEmail}>{member.invited_email}</Text>
          <Text style={styles.memberMeta}>
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)} · {roleLabel}
          </Text>
        </View>
        <Badge label={statusLabel} variant={statusVariant} />
      </View>

      <View style={styles.consumptionRow}>
        <Text style={styles.consumptionLabel}>Consumo del mes</Text>
        <Text style={styles.consumptionValue}>{formatCurrency(member.monthly_spend ?? 0)}</Text>
      </View>

      <View style={styles.roleSelector}>
        {(['owner', 'family', 'authorized'] as LotMemberRole[]).map((role) => {
          const selected = member.role === role;
          return (
            <TouchableOpacity key={role} style={[styles.roleChip, selected && styles.roleChipActive]} onPress={() => void onRoleChange(member, role)}>
              <Text style={[styles.roleChipText, selected && styles.roleChipTextActive]}>
                {role === 'owner' ? 'Titular' : role === 'family' ? 'Familiar' : 'Invitado'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Puede ingresar al market</Text>
        <Switch value={member.can_access_store} onValueChange={(value) => void onPermissionChange(member, { can_access_store: value })} trackColor={{ false: Colors.border, true: Colors.primarySoft }} thumbColor={Colors.surface} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Puede imputar a expensas</Text>
        <Switch value={member.can_charge_expenses} onValueChange={(value) => void onPermissionChange(member, { can_charge_expenses: value })} trackColor={{ false: Colors.border, true: Colors.primarySoft }} thumbColor={Colors.surface} />
      </View>

      <Input
        label="Límite de gasto"
        value={limitValue}
        onChangeText={setLimitValue}
        placeholder="Sin límite"
        keyboardType="numeric"
      />

      <Button
        label={loading ? 'Guardando...' : 'Guardar permisos'}
        onPress={() => void onPermissionChange(member, { spending_limit: limitValue.trim() ? Number(limitValue) : null })}
        loading={loading}
      />

      {member.status === 'pending' && member.invitation_token ? (
        <>
          <Text style={styles.inviteHint}>Invitación pendiente. Compartí el link para que complete el alta una sola vez.</Text>
          <View style={styles.inviteActions}>
            <Button label="Reenviar" size="sm" fullWidth={false} onPress={() => void onShareInvite(member)} />
            <Button label="WhatsApp" variant="success" size="sm" fullWidth={false} onPress={() => void onWhatsAppInvite(member)} />
            <Button label="Copiar link" variant="outline" size="sm" fullWidth={false} onPress={() => void onCopyInvite(member)} />
          </View>
        </>
      ) : member.status === 'active' ? (
        <View style={styles.activeMemberBanner}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
          <Text style={styles.activeMemberText}>Esta cuenta ya fue aceptada y puede iniciar sesión normalmente.</Text>
        </View>
      ) : (
        <View style={styles.revokedBanner}>
          <Ionicons name="pause-circle" size={18} color={Colors.textMuted} />
          <Text style={styles.revokedText}>Acceso revocado. Ya no podrá ingresar ni comprar.</Text>
        </View>
      )}

      <View style={styles.memberActions}>
        {member.status === 'revoked' ? (
          <Button label="Restaurar acceso" variant="secondary" size="sm" fullWidth={false} onPress={() => void onRestore(member)} />
        ) : member.role !== 'owner' ? (
          <Button label="Revocar acceso" variant="danger" size="sm" fullWidth={false} onPress={() => void onRevoke(member)} />
        ) : null}
      </View>
    </View>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
    flexGrow: 1,
  },
  contentWide: {
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  topCopy: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  sectionCopy: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  statLabel: {
    color: Colors.textMuted,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  statValue: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  manageCard: {
    gap: Spacing.sm,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  roleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  roleChipTextActive: {
    color: Colors.textInverse,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  filterChipTextActive: {
    color: Colors.textInverse,
  },
  refreshText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  memberCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  memberTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  memberIdentity: {
    flex: 1,
    gap: 4,
  },
  memberEmail: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  memberMeta: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
  },
  consumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  consumptionLabel: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
  },
  consumptionValue: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  switchLabel: {
    flex: 1,
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
  },
  inviteHint: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  inviteActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  activeMemberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  activeMemberText: {
    flex: 1,
    color: Colors.successDark,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  revokedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.unverifiedLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  revokedText: {
    flex: 1,
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  memberActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
  },
  wideCard: {
    width: '100%',
    maxWidth: 960,
  },
});
