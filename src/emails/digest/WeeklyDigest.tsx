import type { ReactNode } from "react";
import { Link, Row, Column, Section, Text } from "@react-email/components";
import { Button } from "../_components/Button";
import { Layout } from "../_components/Layout";

type DigestItem = {
  title: string;
  href: string;
};

function Hero({
  weekRange,
  attentionCount,
}: {
  weekRange: string;
  attentionCount: number;
}) {
  return (
    <Section
      style={{
        backgroundColor: "#0058BE",
        borderRadius: 16,
        margin: "0 0 16px",
        padding: "28px 28px 24px",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 24,
          fontWeight: 700,
          lineHeight: "30px",
          margin: "0 0 6px",
        }}
      >
        Weekly HR Digest
      </Text>
      <Text
        style={{
          color: "#DBEAFE",
          fontSize: 14,
          lineHeight: "20px",
          margin: 0,
        }}
      >
        {weekRange}
        {attentionCount > 0
          ? ` • ${attentionCount} item${attentionCount === 1 ? "" : "s"} worth your time`
          : ""}
      </Text>
    </Section>
  );
}

function WidgetCard({
  icon,
  iconColor,
  iconBg,
  title,
  pill,
  children,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  pill?: { label: string; color: string; background: string };
  children: ReactNode;
}) {
  return (
    <Section
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        margin: "0 0 16px",
        padding: "20px 20px 18px",
      }}
    >
      <Row style={{ marginBottom: 14 }}>
        <Column style={{ verticalAlign: "middle", width: "40px" }}>
          <Section
            style={{
              backgroundColor: iconBg,
              borderRadius: 8,
              height: 32,
              textAlign: "center",
              width: 32,
            }}
          >
            <Text
              aria-hidden="true"
              style={{
                color: iconColor,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: "32px",
                margin: 0,
              }}
            >
              {icon}
            </Text>
          </Section>
        </Column>
        <Column style={{ verticalAlign: "middle" }}>
          <Text
            style={{
              color: "#0F172A",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: "20px",
              margin: 0,
            }}
          >
            {title}
          </Text>
        </Column>
        {pill && (
          <Column style={{ textAlign: "right", verticalAlign: "middle" }}>
            <Text
              style={{
                backgroundColor: pill.background,
                borderRadius: 999,
                color: pill.color,
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: "16px",
                margin: 0,
                padding: "3px 10px",
              }}
            >
              {pill.label}
            </Text>
          </Column>
        )}
      </Row>
      {children}
    </Section>
  );
}

function DigestRow({
  item,
  accent,
}: {
  item: DigestItem;
  accent: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: "#F8FAFC",
        borderRadius: 10,
        marginBottom: 8,
        padding: "10px 12px",
      }}
    >
      <Row>
        <Column style={{ verticalAlign: "middle", width: "16px" }}>
          <Section
            style={{
              backgroundColor: accent,
              borderRadius: 999,
              height: 8,
              marginRight: 10,
              width: 8,
            }}
          />
        </Column>
        <Column style={{ verticalAlign: "middle" }}>
          <Link
            href={item.href}
            style={{
              color: "#0F172A",
              fontSize: 14,
              fontWeight: 600,
              lineHeight: "20px",
              textDecoration: "none",
            }}
          >
            {item.title}
          </Link>
        </Column>
      </Row>
    </Section>
  );
}

export function WeeklyDigest({
  firstName,
  weekRange,
  articles,
  threads,
  tools,
  usageSummary,
  dashboardUrl,
  unsubscribeUrl,
}: {
  firstName: string;
  weekRange: string;
  articles: DigestItem[];
  threads: DigestItem[];
  tools: DigestItem[];
  usageSummary: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}) {
  const attentionCount = articles.length + threads.length + tools.length;

  return (
    <Layout
      preview={`${articles[0]?.title ?? "New HR resources"}, ${threads[0]?.title ?? "community discussions"}, and more.`}
      unsubscribeUrl={unsubscribeUrl}
      unsubscribeLabel="the weekly digest"
    >
      <Text
        style={{
          color: "#475569",
          fontSize: 14,
          lineHeight: "20px",
          margin: "0 0 12px",
        }}
      >
        Hi {firstName},
      </Text>

      <Hero weekRange={weekRange} attentionCount={attentionCount} />

      {articles.length > 0 && (
        <WidgetCard
          icon="A"
          iconColor="#FFFFFF"
          iconBg="#0058BE"
          title="New articles to read"
          pill={
            articles.length > 2
              ? { label: `${articles.length} new`, color: "#0058BE", background: "#DBEAFE" }
              : undefined
          }
        >
          {articles.map((item) => (
            <DigestRow key={item.href} item={item} accent="#0058BE" />
          ))}
        </WidgetCard>
      )}

      {threads.length > 0 && (
        <WidgetCard
          icon="C"
          iconColor="#FFFFFF"
          iconBg="#6B38D4"
          title="Top community discussions"
        >
          {threads.map((item) => (
            <DigestRow key={item.href} item={item} accent="#6B38D4" />
          ))}
        </WidgetCard>
      )}

      {tools.length > 0 && (
        <WidgetCard
          icon="T"
          iconColor="#FFFFFF"
          iconBg="#924700"
          title="Tools you have not tried"
        >
          {tools.map((item) => (
            <DigestRow key={item.href} item={item} accent="#924700" />
          ))}
        </WidgetCard>
      )}

      <Section
        style={{
          backgroundColor: "#F2F3FD",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          margin: "4px 0 20px",
          padding: "20px 20px 22px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            color: "#0F172A",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: "22px",
            margin: "0 0 6px",
          }}
        >
          Need a hand with something?
        </Text>
        <Text
          style={{
            color: "#475569",
            fontSize: 13,
            lineHeight: "20px",
            margin: "0 0 14px",
          }}
        >
          {usageSummary}
        </Text>
        <Button href={dashboardUrl}>Open Atlas HR</Button>
      </Section>
    </Layout>
  );
}

export default WeeklyDigest;
