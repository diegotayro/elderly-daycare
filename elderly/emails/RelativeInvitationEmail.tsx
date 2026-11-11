import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type RelativeInvitationEmailProps = {
  relativeFirstName: string;
  elderlyFullName: string;
  code: string;
  expiresInDays: number;
  activationUrl: string;
};

const colors = {
  background: "#FBF4EC",
  ink: "#3F362E",
  coral: "#EE8164",
  codeBackground: "#FBF1D6",
  codeInk: "#8A7234",
};

export function RelativeInvitationEmail({
  relativeFirstName,
  elderlyFullName,
  code,
  expiresInDays,
  activationUrl,
}: RelativeInvitationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Te invitaron a seguir a ${elderlyFullName} en Casa Nogal`}</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          color: colors.ink,
          fontFamily: "Nunito, Arial, sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container style={{ maxWidth: 480, padding: "0 20px" }}>
          <Text style={{ fontSize: 18, fontWeight: 800 }}>
            Hola {relativeFirstName},
          </Text>
          <Text style={{ fontSize: 16, lineHeight: "24px" }}>
            Te invitaron a seguir a <strong>{elderlyFullName}</strong> en Casa
            Nogal. Ahí verás sus comidas, siestas, actividades y anuncios.
          </Text>
          <Section
            style={{
              backgroundColor: colors.codeBackground,
              borderRadius: 14,
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: colors.codeInk,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                margin: 0,
              }}
            >
              TU CÓDIGO DE INVITACIÓN
            </Text>
            <Text
              style={{
                color: colors.codeInk,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 6,
                margin: "4px 0 0",
              }}
            >
              {code}
            </Text>
          </Section>
          <Section style={{ margin: "24px 0", textAlign: "center" }}>
            <Button
              href={activationUrl}
              style={{
                backgroundColor: colors.coral,
                borderRadius: 14,
                boxSizing: "border-box",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 800,
                padding: "14px 28px",
                textDecoration: "none",
              }}
            >
              Activar mi cuenta
            </Button>
          </Section>
          <Text style={{ fontSize: 14, color: colors.codeInk }}>
            La invitación vence en {expiresInDays} días.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
