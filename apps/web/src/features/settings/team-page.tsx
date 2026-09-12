"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditorDialog } from "@/components/forms/editor-dialog";
import { Field, NativeSelect } from "@/components/forms/field";
import {
  BusyIcon,
  EmptyView,
  ErrorView,
  FieldError,
  LoadingView,
} from "@/components/feedback";
import {
  PermissionGate,
  DemoNotice,
} from "@/features/workspace/permission-gate";
import { useResource, useWorkspace } from "@/features/workspace/workspace";
import { useCommand } from "@/features/workspace/use-command";
import { apiRequest } from "@/lib/api/client";
import {
  acknowledgmentSchema,
  memberSchema,
  type Member,
} from "@/lib/api/contracts";
import { memberFormSchema } from "@/lib/form-schemas";
import { ROLE_LABELS, formatDate } from "@/lib/formatters";
import { errorMessage } from "@/lib/api/errors";

const ROLES = ["admin", "analyst", "viewer"] as const;
type EditableRole = (typeof ROLES)[number];
const ROLE_HELP = {
  admin: "Administra la empresa, sus datos y el equipo.",
  analyst: "Consulta información y prepara proyecciones.",
  viewer: "Consulta el resumen y sus recomendaciones.",
};
const MEMBER_STATUS = {
  active: "Activo",
  invited: "Invitación enviada",
  suspended: "Suspendido",
};
export function TeamPage() {
  return (
    <PermissionGate permission="member:read">
      <TeamContent />
    </PermissionGate>
  );
}
function TeamContent() {
  const { organization, userId, email, isDemo, can } = useWorkspace();
  const members = useResource("members", z.array(memberSchema));
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [role, setRole] = useState<EditableRole>("viewer");
  const edit = useCommand(
    (input: { userId: string; role: EditableRole }) =>
      apiRequest(
        `/organizations/${organization.id}/members/${input.userId}`,
        acknowledgmentSchema,
        { method: "PATCH", body: { role: input.role } },
      ),
    "Rol actualizado",
    () => setEditing(null),
  );
  const remove = useCommand(
    (member: Member) =>
      apiRequest(
        `/organizations/${organization.id}/members/${member.userId}`,
        acknowledgmentSchema,
        { method: "DELETE" },
      ),
    "Acceso retirado",
    () => setRemoving(null),
  );
  const memberName = (member: Member) =>
    member.userId === userId
      ? `${email ?? "Tu cuenta"} (tú)`
      : (member.email ?? `Usuario ${member.userId}`);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tu equipo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada persona, con el acceso que necesita.
          </p>
        </div>
        {can("member:invite") && (
          <Button disabled={isDemo} onClick={() => setInviting(true)}>
            <UserPlus />
            Invitar persona
          </Button>
        )}
      </div>
      <DemoNotice />
      {members.isPending ? (
        <LoadingView />
      ) : members.isError ? (
        <ErrorView error={members.error} retry={() => void members.refetch()} />
      ) : !members.data.length ? (
        <EmptyView
          title="No hay miembros para mostrar"
          description="Invita a las personas que colaboran contigo."
        />
      ) : (
        <div className="panel divide-y">
          {members.data.map((member) => (
            <div key={member.id} className="flex items-start gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Users className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">
                  {memberName(member)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{ROLE_LABELS[member.role]}</span>
                  <Badge variant="outline">
                    {MEMBER_STATUS[member.status]}
                  </Badge>
                  {member.joinedAt && (
                    <span>Desde {formatDate(member.joinedAt)}</span>
                  )}
                </div>
              </div>
              {member.role !== "owner" &&
                member.userId !== userId &&
                (can("member:update") || can("member:remove")) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={isDemo}
                        variant="ghost"
                        size="icon"
                        aria-label={`Opciones de ${memberName(member)}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {can("member:update") && (
                        <DropdownMenuItem
                          className="min-h-11"
                          onSelect={() => {
                            setRole(
                              member.role === "admin" ||
                                member.role === "analyst"
                                ? member.role
                                : "viewer",
                            );
                            setEditing(member);
                          }}
                        >
                          Cambiar rol
                        </DropdownMenuItem>
                      )}
                      {can("member:remove") && (
                        <DropdownMenuItem
                          className="min-h-11"
                          variant="destructive"
                          onSelect={() => setRemoving(member)}
                        >
                          Retirar acceso
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
        Los miembros sin correo disponible se muestran con su identificador. El
        propietario conserva la administración de la empresa.
      </p>
      {inviting && <InviteDialog open onOpenChange={setInviting} />}
      <EditorDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Cambiar rol"
        description={editing ? memberName(editing) : ""}
        dirty={Boolean(editing && role !== editing.role)}
        busy={edit.isPending}
      >
        <Field id="edit-member-role" label="Acceso">
          <NativeSelect
            id="edit-member-role"
            value={role}
            onChange={(event) => {
              const result = memberFormSchema.shape.role.safeParse(
                event.target.value,
              );
              if (result.success) setRole(result.data);
            }}
            disabled={edit.isPending}
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <p className="text-sm text-muted-foreground">{ROLE_HELP[role]}</p>
        <Button
          disabled={edit.isPending || role === editing?.role}
          onClick={() =>
            editing && edit.mutate({ userId: editing.userId, role })
          }
        >
          {edit.isPending && <BusyIcon />}Guardar rol
        </Button>
        {edit.isError && <FieldError message={errorMessage(edit.error)} />}
      </EditorDialog>
      <EditorDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Retirar acceso"
        description={`${removing ? memberName(removing) : "Esta persona"} dejará de tener acceso a esta empresa.`}
        busy={remove.isPending}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => setRemoving(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => removing && remove.mutate(removing)}
          >
            {remove.isPending && <BusyIcon />}Retirar acceso
          </Button>
        </div>
        {remove.isError && <FieldError message={errorMessage(remove.error)} />}
      </EditorDialog>
    </>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { organization } = useWorkspace();
  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    mode: "onBlur",
    defaultValues: { email: "", role: "viewer" },
  });
  const role = form.watch("role");
  const mutation = useCommand(
    (values: z.infer<typeof memberFormSchema>) =>
      apiRequest(
        `/organizations/${organization.id}/members`,
        acknowledgmentSchema,
        { method: "POST", body: values },
      ),
    "Invitación enviada",
    () => onOpenChange(false),
  );
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invitar a tu equipo"
      description="Enviaremos una invitación al correo indicado."
      dirty={form.formState.isDirty}
      busy={mutation.isPending}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <fieldset disabled={mutation.isPending} className="space-y-5">
          <Field
            id="invite-email"
            label="Correo electrónico"
            error={form.formState.errors.email?.message}
          >
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              aria-describedby="invite-email-error"
              {...form.register("email")}
            />
          </Field>
          <Field id="invite-role" label="Acceso">
            <NativeSelect id="invite-role" {...form.register("role")}>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <p className="text-sm text-muted-foreground">{ROLE_HELP[role]}</p>
        </fieldset>
        {mutation.isError && (
          <FieldError message={errorMessage(mutation.error)} />
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <BusyIcon />}Enviar invitación
        </Button>
      </form>
    </EditorDialog>
  );
}
