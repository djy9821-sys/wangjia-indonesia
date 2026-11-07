import { t, useLang } from "../../utils/i18n";
import { LangToggle } from "../../components/common/lang-toggle";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { BookOpen } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { Link } from "react-router-dom";

/*
  One-page operating manual for the team (sales / finance / warehouse), in
  Chinese and Indonesian, so nobody needs the README to run the day.
*/
const Section = ({ title, steps, to }: { title: string; steps: string[]; to?: string }) => (
  <Container className="flex flex-col gap-y-2 px-6 py-4">
    <div className="flex items-center justify-between">
      <Heading level="h2">{title}</Heading>
      {to && <Link to={to} className="txt-small text-ui-fg-interactive underline">{t("打开")}</Link>}
    </div>
    <ol className="list-decimal pl-5 flex flex-col gap-y-1 txt-small text-ui-fg-subtle">
      {steps.map((s) => <li key={s}>{s}</li>)}
    </ol>
  </Container>
);

const GuidePage = () => {
  useLang();
  return (
    <div className="flex flex-col gap-y-4">
      <Container className="px-6 py-4 flex items-center justify-between">
        <div>
          <Heading level="h1">{t("团队操作指南")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">{t("一台机器从询价到售后的完整流程，按角色分工。")}</Text>
        </div>
        <LangToggle />
      </Container>
      <Section
        title={t("销售：询价与下单")}
        to="/quotes"
        steps={[
          t("客户在 App 或网站发起询价后，在「Quotes」里回复价格、运费和交期，客户接受后自动生成订单。"),
          t("打开订单，在右侧「付款计划」里创建分期（默认定金 30% / 尾款 70%），备注收款账户；客户会立刻收到 WhatsApp。"),
          t("客户直接下单的订单也必须先建付款计划，仓库才会看到。"),
        ]}
      />
      <Section
        title={t("财务：确认到款")}
        to="/finance"
        steps={[
          t("「财务到款」页列出客户上传的转账凭证和 Midtrans 处理中的款项。"),
          t("核对银行流水后点「确认到账」；金额不符点「拒绝」并写明原因，客户会收到通知重新上传。"),
          t("定金确认后订单自动放行给仓库；全款模式要全部确认。退款、取消在订单页操作。"),
          t("月底用「下载 CSV」导出到款与退款明细给会计。"),
        ]}
      />
      <Section
        title={t("仓库：发货与序列号")}
        to="/warehouse"
        steps={[
          t("「仓库发货」只显示已放行的订单。打开订单，先「Create Fulfillment」备货。"),
          t("装箱时在右侧「机身序列号」面板扫描或输入每台机器的序列号（出厂时已贴二维码标签）。"),
          t("「Mark as shipped」填承运商和单号，格式「承运商代码:单号」，如 jne:JP0123456789，客户就能在 App 里看物流轨迹。"),
          t("收货地址有「地图定位」链接时，把它发给货车司机。"),
        ]}
      />
      <Section
        title={t("出厂：生成防伪标签")}
        to="/warranty"
        steps={[
          t("每批机器出厂前在「防伪保修」页选择产品、数量、批次号，点「生成并下载标签」。"),
          t("自动下载 A4 标签 PDF（3×8 格，70×37 mm 不干胶）直接打印，贴在铭牌旁；CSV 给专业标签机。"),
          t("标签丢失或作废时在列表里点「作废」，之后扫码显示「无法验证」。"),
          t("「只看可疑扫码」能找出被扫描过多次的标签，是仿品复制标签的信号。"),
        ]}
      />
      <Section
        title={t("售后：保修与配件")}
        steps={[
          t("客户扫码或在订单里一键登记保修，系统自动发保修凭证；到期前 30 天自动提醒检修和配件。"),
          t("客户在 App「我的机器」点「Minta servis」会带序列号发 WhatsApp 给我们；在客户详情页右侧能看到他所有机器和保修到期日。"),
          t("发票 PDF 底部印有该订单的机身序列号，方便对账和维修记录。"),
        ]}
      />
      <Section
        title={t("经销商：开子账号与信用额度")}
        to="/companies"
        steps={[
          t("在「Companies」新建经销商公司（如 Pusat Kincir），填地址、币种 IDR。"),
          t("在公司页「Employees」邀请经销商的采购员邮箱；勾选 Admin 的员工可以审批同事下单，Spending limit 是每人下单额度。"),
          t("经销商用 App 或网站登录后，下单会带上公司信息，询价和付款计划照常；需要赊销时在付款计划里把尾款到期日设到约定账期。"),
          t("经销商卖出的机器同样由客户自己扫码登记保修，后台能看到是哪家经销商的订单。"),
        ]}
      />
      <Section
        title={t("负责人：角色与日报")}
        to="/team"
        steps={[
          t("在 Settings → Users 邀请同事，然后在「团队角色」分配 sales / finance / warehouse；只有负责人可以强制放行。"),
          t("每天 07:30 会收到一条中文日报（新订单、到账、逾期、待报价、新登记保修），在服务器 .env 里配置 OWNER_WHATSAPP / OWNER_EMAILS。"),
          t("订单列表上方的总览卡片是当天要处理的事项。"),
        ]}
      />
    </div>
  );
};

export const config = defineRouteConfig({
  label: "操作指南 / Panduan",
  icon: BookOpen,
});

export default GuidePage;
