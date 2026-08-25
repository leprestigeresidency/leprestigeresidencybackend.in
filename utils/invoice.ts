import PDFDocument from 'pdfkit';
import { Booking } from '../firebase/types';

export async function generateInvoicePdfBuffer(booking: Booking): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#1E293B')
        .text('LE PRESTIGE RESIDENCY', { align: 'left' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#64748B')
        .text('Luxury Stay & Hospitality', { align: 'left' });
      doc.moveDown(1.5);

      // Invoice Title & Details
      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#0F172A')
        .text('TAX INVOICE', { align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#475569')
        .text(`Invoice ID: INV-${booking.bookingId}`, { align: 'right' })
        .text(`Booking Reference: ${booking.bookingId}`, { align: 'right' })
        .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, { align: 'right' });

      doc.moveDown(2);

      // Guest Info
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#0F172A')
        .text('Billed To:', { underline: true });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(`Guest Name: ${booking.guestName}`)
        .text(`Email: ${booking.email}`)
        .text(`Phone: ${booking.phone}`);

      doc.moveDown(2);

      // Reservation Details Table Header
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Reservation Summary', { underline: true });
      doc.moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(`Room: ${booking.roomName}`)
        .text(`Check-In: ${booking.checkIn}`)
        .text(`Check-Out: ${booking.checkOut}`)
        .text(`Nights: ${booking.nights}`)
        .text(`Guests: ${booking.adults} Adults, ${booking.children} Children`);

      doc.moveDown(2);

      // Financial Breakup
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Payment Breakdown', { underline: true });
      doc.moveDown(0.5);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(`Room Rate per Night: ₹${booking.roomRate.toLocaleString()}`)
        .text(`Subtotal (${booking.nights} nights): ₹${booking.subtotal.toLocaleString()}`);

      if (booking.discount > 0) {
        doc.text(`Discount (${booking.couponCode || 'Promo'}): -₹${booking.discount.toLocaleString()}`);
      }

      doc.text(`Tax & GST (18%): ₹${(booking.tax + booking.gst).toLocaleString()}`);
      doc.moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0F172A')
        .text(`Total Amount Paid: ₹${booking.total.toLocaleString()}`);

      doc.moveDown(3);

      // Footer
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#94A3B8')
        .text('Thank you for choosing Le Prestige Residency!', { align: 'center' })
        .text('This is a computer-generated tax invoice and requires no physical signature.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
