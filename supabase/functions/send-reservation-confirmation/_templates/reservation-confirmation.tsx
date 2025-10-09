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

interface ReservationConfirmationEmailProps {
  name: string
  email: string
  reservationId: string
  date: string
  time: string
  people: number
  tableNumber?: number
  eventType?: string
  services?: string[]
  notes?: string
  phone: string
}

export const ReservationConfirmationEmail = ({
  name,
  email,
  reservationId,
  date,
  time,
  people,
  tableNumber,
  eventType,
  services,
  notes,
  phone,
}: ReservationConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your reservation at Zebib Foods is confirmed! #{reservationId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reservation Confirmed! 📅</Heading>
        <Text style={text}>
          Dear {name},
        </Text>
        <Text style={text}>
          We're excited to welcome you to Zebib Foods! Your table has been reserved.
        </Text>
        
        <Section style={reservationInfoSection}>
          <Heading style={h2}>Reservation Details</Heading>
          <Text style={infoText}><strong>Reservation ID:</strong> #{reservationId}</Text>
          <Text style={infoText}><strong>Date:</strong> {date}</Text>
          <Text style={infoText}><strong>Time:</strong> {time}</Text>
          <Text style={infoText}><strong>Number of Guests:</strong> {people}</Text>
          {tableNumber && <Text style={infoText}><strong>Table Number:</strong> {tableNumber}</Text>}
          {eventType && <Text style={infoText}><strong>Event Type:</strong> {eventType}</Text>}
          <Text style={infoText}><strong>Phone:</strong> {phone}</Text>
          
          {services && services.length > 0 && (
            <>
              <Text style={infoText}><strong>Special Services:</strong></Text>
              {services.map((service, index) => (
                <Text key={index} style={serviceItem}>• {service}</Text>
              ))}
            </>
          )}
          
          {notes && (
            <Text style={infoText}><strong>Special Requests:</strong> {notes}</Text>
          )}
        </Section>

        <Section style={reminderSection}>
          <Text style={reminderText}>
            ⏰ We'll send you a reminder a few hours before your reservation.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Link href="https://zebibfood.de" style={button}>
            View Menu
          </Link>
        </Section>

        <Text style={text}>
          If you need to modify or cancel your reservation, please contact us as soon as possible.
        </Text>

        <Text style={footer}>
          We look forward to serving you!<br />
          The Zebib Foods Team<br />
          <Link href="https://zebibfood.de" style={link}>zebibfood.de</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReservationConfirmationEmail

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

const reservationInfoSection = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
}

const infoText = {
  color: '#333333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const serviceItem = {
  color: '#333333',
  fontSize: '14px',
  margin: '4px 0 4px 16px',
}

const reminderSection = {
  backgroundColor: '#FEF3C7',
  padding: '16px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #D97706',
}

const reminderText = {
  color: '#92400E',
  fontSize: '14px',
  margin: '0',
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
