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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderConfirmationEmailProps {
  name: string
  email: string
  orderId: string
  items: OrderItem[]
  totalAmount: number
  diningType: string
  date: string
  time: string
  tableNumber?: number
  phone: string
}

export const OrderConfirmationEmail = ({
  name,
  email,
  orderId,
  items,
  totalAmount,
  diningType,
  date,
  time,
  tableNumber,
  phone,
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Zebib Foods order has been confirmed! #{orderId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order Confirmed! ✅</Heading>
        <Text style={text}>
          Dear {name},
        </Text>
        <Text style={text}>
          Thank you for your order! We've received your request and are preparing your delicious Ethiopian meal.
        </Text>
        
        <Section style={orderInfoSection}>
          <Heading style={h2}>Order Details</Heading>
          <Text style={infoText}><strong>Order ID:</strong> #{orderId}</Text>
          <Text style={infoText}><strong>Date:</strong> {date}</Text>
          <Text style={infoText}><strong>Time:</strong> {time}</Text>
          <Text style={infoText}><strong>Type:</strong> {diningType}</Text>
          {tableNumber && <Text style={infoText}><strong>Table Number:</strong> {tableNumber}</Text>}
          <Text style={infoText}><strong>Phone:</strong> {phone}</Text>
        </Section>

        <Section style={itemsSection}>
          <Heading style={h2}>Your Order</Heading>
          {items.map((item, index) => (
            <Section key={index} style={itemRow}>
              <Text style={itemText}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={itemPrice}>€{(item.price / 100).toFixed(2)}</Text>
            </Section>
          ))}
          <Hr style={divider} />
          <Section style={itemRow}>
            <Text style={totalText}>Total</Text>
            <Text style={totalPrice}>€{(totalAmount / 100).toFixed(2)}</Text>
          </Section>
        </Section>

        <Section style={ctaSection}>
          <Link href="https://zebibfood.de/order" style={button}>
            Track Your Order
          </Link>
        </Section>

        <Text style={text}>
          We'll notify you when your order is ready. If you have any questions, please don't hesitate to contact us.
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

export default OrderConfirmationEmail

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

const orderInfoSection = {
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

const itemsSection = {
  margin: '20px 0',
}

const itemRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '8px 0',
}

const itemText = {
  color: '#333333',
  fontSize: '16px',
  margin: '0',
}

const itemPrice = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const divider = {
  borderColor: '#e0e0e0',
  margin: '16px 0',
}

const totalText = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const totalPrice = {
  color: '#D97706',
  fontSize: '20px',
  fontWeight: 'bold',
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
