import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Users } from "@medusajs/icons";
import { Badge, Container, Heading, Select, Table, Text, Toaster, toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../lib/client";

type TeamResponse = {
  bootstrap: boolean;
  me: { id: string; role: string; bootstrap: boolean };
  roles: { value: string; label: string }[];
  users: { id: string; email: string; first_name?: string | null; last_name?: string | null; role: string; role_explicit: boolean }[];
};

const ROLE_HELP: Record<string, string> = {
  owner: "全部权限，可分配角色、强制放行",
  sales: "报价、创建/取消付款计划",
  finance: "确认到款、拒绝凭证、退款、取消",
  warehouse: "备货与发货（仅已放行订单）",
  none: "只能查看，不能操作付款与发货",
};

const TeamPage = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["team"],
    queryFn: () => sdk.client.fetch<TeamResponse>("/admin/team"),
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      sdk.client.fetch(`/admin/team/${id}/role`, { method: "POST", body: { role } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["me", "role"] });
      toast.success("角色已更新");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isOwner = q.data?.me.role === "owner";

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex flex-col gap-y-1">
          <Heading level="h2">团队角色 / Peran Tim</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            在 Settings → Users 邀请同事后，在这里分配角色。只有负责人可以修改。
          </Text>
          {q.data?.bootstrap && (
            <Badge color="orange" className="w-fit">
              尚未分配任何角色：当前所有管理员都按负责人处理。请先给自己设为负责人。
            </Badge>
          )}
        </div>
        {q.isLoading && <Text className="px-6 pb-4">加载中…</Text>}
        {q.error && <Text className="px-6 pb-4 text-ui-fg-error">{(q.error as Error).message}</Text>}
        {q.data && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>邮箱</Table.HeaderCell>
                <Table.HeaderCell>姓名</Table.HeaderCell>
                <Table.HeaderCell>角色</Table.HeaderCell>
                <Table.HeaderCell>权限说明</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data.users.map((u) => (
                <Table.Row key={u.id}>
                  <Table.Cell>
                    {u.email}
                    {u.id === q.data!.me.id && <Badge size="2xsmall" color="blue" className="ml-2">我</Badge>}
                  </Table.Cell>
                  <Table.Cell>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}</Table.Cell>
                  <Table.Cell>
                    {isOwner ? (
                      <Select
                        size="small"
                        value={u.role}
                        onValueChange={(role) => setRole.mutate({ id: u.id, role })}
                      >
                        <Select.Trigger className="w-56">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {q.data!.roles.map((r) => (
                            <Select.Item key={r.value} value={r.value}>{r.label}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    ) : (
                      <Badge size="2xsmall">{q.data!.roles.find((r) => r.value === u.role)?.label ?? u.role}</Badge>
                    )}
                    {!u.role_explicit && <Text size="xsmall" className="text-ui-fg-subtle">（未显式分配）</Text>}
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle txt-small">{ROLE_HELP[u.role]}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineRouteConfig({
  label: "团队角色",
  icon: Users,
});

export default TeamPage;
