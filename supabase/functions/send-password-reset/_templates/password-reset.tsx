import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetLink: string
  name?: string
}

export const PasswordResetEmail = ({ resetLink, name }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Zebib Foods password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Password Reset Request 🔐</Heading>
        <Text style={text}>
          {name ? `Hello ${name},` : 'Hello,'}
        </Text>
        <Text style={text}>
          We received a request to reset your password for your Zebib Foods account. 
          Click the button below to create a new password:
        </Text>
        
        <Section style={ctaSection}>
          <Link href={resetLink} style={button}>
            Reset Password
          </Link>
        </Section>

        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{resetLink}</Text>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⚠️ This link will expire in 1 hour for security reasons.
          </Text>
          <Text style={warningText}>
            If you didn't request a password reset, please ignore this email or contact us if you have concerns.
          </Text>
        </Section>

        <Text style={footer}>
          Best regards,<br />
          The Zebib Foods Team<br />
          <Link href="https://zebibfood.de" style={link}>zebibfood.de</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const ctaSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#D97706',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const linkText = {
  color: '#666666',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '16px 0',
}

const warningBox = {
  backgroundColor: '#FEF3C7',
  border: '1px solid #FCD34D',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const link = {
  color: '#D97706',
  textDecoration: 'underline',
}

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
