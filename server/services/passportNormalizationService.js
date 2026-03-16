const clean = (v = '') => String(v || '').trim();
const normalizeName = (v = '') =>
    clean(v).replace(/\s+/g, ' ').toUpperCase();

const normalizePassportNumber = (v = '') =>
    clean(v).replace(/[^A-Z0-9]/gi, '').toUpperCase();

export function normalizeDateToDDMMYYYY(value = '') {
    const s = clean(value);
    if (!s) return '';


    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
        const d = String(Number(iso[3])).padStart(2, '0');
        const m = String(Number(iso[2])).padStart(2, '0');
        const y = iso[1];
        return `${d}/${m}/${y}`;
    }

     const dmy = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmy) {
        const d = String(Number(dmy[1])).padStart(2, '0');
        const m = String(Number(dmy[2])).padStart(2, '0');
        const y = dmy[3];
        return `${d}/${m}/${y}`;
    }

    return s;

}

export function normalizeExtractedPassport(data = {}) {
    return {
        surname: normalizeName(data.surname),
        firstName: normalizeName(data.surname),
        middleName: normalizeName(data.middleName),
        dateOfBirth: normalizeDateToDDMMYYYY(data.dateOfBirth),
        passportNumber: normalizePassportNumber(data.passportNumber),
        dateOfIssue: normalizeDateToDDMMYYYY(data.dateOfIssue),
        dateOfExpiry: normalizeDateToDDMMYYYY(data.dateOfExpiry),
        confidence: data.confidence || {},
        
    };
}
