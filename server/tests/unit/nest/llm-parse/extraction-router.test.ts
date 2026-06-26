import { describe, it, expect } from 'vitest';
import { extractBookingRef, extractTotalPrice, normCurrency } from '../../../../src/nest/llm-parse/router/extraction-router';

describe('extractBookingRef', () => {
  it('reads an Airbnb "Bestätigungs-Code"', () => {
    expect(extractBookingRef('Bestätigungs-Code\nHMHJ9RTEEK')).toBe('HMHJ9RTEEK');
  });
  it('prefers the customer "Reservation No." over a later "Supplier Reference"', () => {
    expect(extractBookingRef('Reservation No.: G72820729\nSUPPLIER DETAILS\nSupplier Reference: IT587200464')).toBe('G72820729');
  });
  it('reads an Expedia "Reiseplan" number', () => {
    expect(extractBookingRef('Expedia-Reiseplan: 73222406755286')).toBe('73222406755286');
  });
  it('reads a classic "Buchungsnummer" / "PNR"', () => {
    expect(extractBookingRef('Buchungsnummer: ABC123')).toBe('ABC123');
    expect(extractBookingRef('PNR XY7Q9Z')).toBe('XY7Q9Z');
  });
  it('does not capture a prose word after a bare "Confirmation"/"reference"', () => {
    expect(extractBookingRef('Booking Confirmation\n\nThank you for choosing us')).toBeUndefined();
    expect(extractBookingRef('For future reference please retain this email')).toBeUndefined();
  });
});

describe('extractTotalPrice', () => {
  it('reads a labeled German total', () => {
    expect(extractTotalPrice('Gesamtpreis 61,23 €')).toEqual({ price: '61,23', currency: 'EUR' });
  });
  it('reads an Airbnb "Bezahlter Betrag"', () => {
    expect(extractTotalPrice('Bezahlter Betrag\n651,86 €')).toEqual({ price: '651,86', currency: 'EUR' });
  });
  it('falls back to a standalone ¥ voucher price (JPY) with no nearby label', () => {
    expect(extractTotalPrice('Price (consumption tax included)\n金額(消費税込)\n¥9,400\nAdult')).toEqual({ price: '9,400', currency: 'JPY' });
  });
  it('returns null when there is neither a labeled nor a symbol amount', () => {
    expect(extractTotalPrice('Just some terms and conditions, no price here.')).toBeNull();
  });
});

describe('normCurrency', () => {
  it('maps symbols and codes to ISO 4217', () => {
    expect(normCurrency('€')).toBe('EUR');
    expect(normCurrency('¥')).toBe('JPY');
    expect(normCurrency('$')).toBe('USD');
    expect(normCurrency('CHF')).toBe('CHF');
  });
  it('returns undefined for an unrecognised token', () => {
    expect(normCurrency('')).toBeUndefined();
    expect(normCurrency('hello world')).toBeUndefined();
  });
});
