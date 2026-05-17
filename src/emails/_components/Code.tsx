import { Text } from "@react-email/components";

export function Code({ value }: { value: string }) {
  return (
    <Text
      style={{
        backgroundColor: "#F1F5F9",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        color: "#0F172A",
        fontFamily: "Menlo, Consolas, monospace",
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 4,
        margin: "20px 0",
        padding: "16px 20px",
        textAlign: "center",
      }}
    >
      {value}
    </Text>
  );
}
