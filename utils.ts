export const formatPrice = (value: number | string): string => {
    if (value === 0 || value === '0') return '0';
    if (!value) return '';
    const str = value.toString().replace(/\s/g, '');
    if (isNaN(Number(str))) return str;
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};


export const parsePrice = (value: string): number => {
    const cleaned = value.replace(/\s/g, '');
    return cleaned === '' ? 0 : Number(cleaned);
};

export const formatPhone = (value: string): string => {
    if (!value) return '+998 ';

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Check if it already starts with 998, if so remove it to normalize
    const suffix = digits.startsWith('998') ? digits.slice(3) : digits;

    // Limit to 9 digits (Uzbekistan phone length without country code)
    const limited = suffix.slice(0, 9);

    // Add formatting
    let formatted = '+998';
    if (limited.length > 0) formatted += ' ' + limited.substring(0, 2);
    if (limited.length > 2) formatted += ' ' + limited.substring(2, 5);
    if (limited.length > 5) formatted += ' ' + limited.substring(5, 7);
    if (limited.length > 7) formatted += ' ' + limited.substring(7, 9);

    return formatted;
};

export const parsePhone = (value: string): string => {
    // Keep only formatting relevant for storage if needed, or just digits.
    // Usually we might want to store as +998901234567
    const digits = value.replace(/\D/g, '');
    // If user deleted everything, return empty
    if (!digits) return '';
    // Ensure 998 prefix is present in storage if digits exist
    if (digits.startsWith('998')) return '+' + digits;
    return '+998' + digits;
};

export const isValidPhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 12;
};

export const isValidName = (value: string): boolean => {
    return value.trim().length >= 3;
};
