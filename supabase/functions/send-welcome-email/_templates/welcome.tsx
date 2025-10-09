import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WelcomeEmailProps {
  name: string
  email: string
}

export const WelcomeEmail = ({ name, email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Zebib Foods - Your Ethiopian Culinary Journey Begins!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Zebib Foods! 🎉</Heading>
        <Text style={text}>
          Dear {name},
        </Text>
        <Text style={text}>
          Thank you for joining Zebib Foods! We're thrilled to have you as part of our community.
          Get ready to experience authentic Ethiopian cuisine delivered right to your door.
        </Text>
        <Section style={benefitsSection}>
          <Heading style={h2}>What You Can Do:</Heading>
          <Text style={benefitItem}>🍽️ Browse our authentic Ethiopian menu</Text>
          <Text style={benefitItem}>📅 Make table reservations easily</Text>
          <Text style={benefitItem}>🚀 Quick online ordering</Text>
          <Text style={benefitItem}>🎫 Get exclusive offers and updates</Text>
        </Section>
        <Section style={ctaSection}>
          <Link
            href="https://zebibfood.de"
            style={button}
          >
            Start Ordering Now
          </Link>
        </Section>
        <Text style={text}>
          If you have any questions, feel free to reach out to us anytime.
        </Text>
        <Text style={footer}>
          Best regards,<br />
          The Zebib Foods Team<br />
          <Link href="https://zebibfood.de" style={link}>zebibfood.de</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const benefitsSection = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
}

const benefitItem = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '8px 0',
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
