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

interface ReservationReminderEmailProps {
  name: string
  date: string
  time: string
  people: number
  tableNumber?: number
}

export const ReservationReminderEmail = ({
  name,
  date,
  time,
  people,
  tableNumber,
}: ReservationReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Reminder: Your reservation at Zebib Foods is today!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reservation Reminder ⏰</Heading>
        <Text style={text}>
          Hello {name},
        </Text>
        <Text style={text}>
          This is a friendly reminder that you have a reservation at Zebib Foods today!
        </Text>
        
        <Section style={reservationInfoSection}>
          <Text style={highlightText}>📅 {date}</Text>
          <Text style={highlightText}>🕐 {time}</Text>
          <Text style={highlightText}>👥 {people} {people === 1 ? 'guest' : 'guests'}</Text>
          {tableNumber && <Text style={highlightText}>🪑 Table {tableNumber}</Text>}
        </Section>

        <Section style={reminderBox}>
          <Text style={reminderTitle}>Please Note:</Text>
          <Text style={reminderText}>
            • Arrive on time to ensure we can accommodate you<br />
            • If you need to cancel or modify, please contact us ASAP<br />
            • We look forward to serving you authentic Ethiopian cuisine!
          </Text>
        </Section>

        <Text style={text}>
          See you soon!
        </Text>

        <Text style={footer}>
          Warm regards,<br />
          The Zebib Foods Team<br />
          <Link href="https://zebibfood.de" style={link}>zebibfood.de</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReservationReminderEmail

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

const reservationInfoSection = {
  backgroundColor: '#FEF3C7',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const highlightText = {
  color: '#92400E',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const reminderBox = {
  borderLeft: '4px solid #D97706',
  paddingLeft: '16px',
  margin: '24px 0',
}

const reminderTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const reminderText = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
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
