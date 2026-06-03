import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date, locale = 'en-IN') =>
  new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** User.address is an object in MongoDB — never render it directly in JSX */
export const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
};

export const calcProfileCompletion = (user) => {
  if (!user) return 0;
  const fields = [
    user.name, user.email, user.phone, user.dob, user.gender,
    user.bloodGroup, user.profileImage, user.height, user.weight,
    formatAddress(user.address),
    user.allergies?.length, user.emergencyContact?.name,
  ];
  const filled = fields.filter((v) => v !== null && v !== undefined && v !== '').length;
  return Math.round((filled / fields.length) * 100);
};
