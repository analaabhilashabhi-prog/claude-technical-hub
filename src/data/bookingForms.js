// Config-driven booking forms. Each entry defines the modal copy, the storage
// key used to persist submissions (frontend-only for now), and its fields.
// Adding a new booking flow = add an entry here; the modal + admin page adapt.

import {
  Calendar,
  Cube,
  User,
  Building,
  Mail,
  Phone,
  Pin,
} from '../components/Icons'

// Field types: 'text' | 'tel' | 'email' | 'textarea' | 'select'
export const bookingForms = {
  webinar: {
    id: 'webinar',
    storageKey: 'webinarBookings',
    icon: Calendar,
    title: 'Book a Webinar Slot',
    subtitle: 'All fields are required.',
    submitLabel: 'Request Slot',
    successTitle: 'Slot Requested!',
    successText: (f) =>
      `Thanks, ${f.firstName}. Your webinar slot request has been captured. We'll reach out at ${f.email} to confirm.`,
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'Jane',
        icon: User,
        autoComplete: 'given-name',
        required: true,
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
        icon: User,
        autoComplete: 'family-name',
        required: true,
      },
      {
        name: 'Organization-College Name',
        label: 'Organization-College Name',
        type: 'text',
        placeholder: 'Acme Corp',
        icon: Building,
        autoComplete: 'organization',
        required: true,
        full: true,
      },
      {
        name: 'mobile',
        label: 'Mobile Number',
        type: 'tel',
        placeholder: '9876543210',
        icon: Phone,
        autoComplete: 'tel',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'jane@company.com',
        icon: Mail,
        autoComplete: 'email',
        required: true,
      },
    ],
  },

  aiLab: {
    id: 'aiLab',
    storageKey: 'aiLabBookings',
    icon: Cube,
    title: 'Set Up an AI Lab',
    subtitle: 'Tell us about your organization and we’ll get in touch.',
    submitLabel: 'Request AI Lab Setup',
    successTitle: 'Request Received!',
    successText: (f) =>
      `Thanks, ${f.contactPerson}. We've captured your AI Lab setup request for ${f.organization}. Our team will contact you at ${f.email}.`,
    fields: [
      {
        name: 'organization',
        label: 'Organization Name',
        type: 'text',
        placeholder: 'Acme Institute of Technology',
        icon: Building,
        autoComplete: 'organization',
        required: true,
        full: true,
      },
      {
        name: 'orgType',
        label: 'Organization Type',
        type: 'select',
        icon: Building,
        required: true,
        options: [
          'College / University',
          'School',
          'Enterprise / Corporate',
          'Startup',
          'Government / Public Sector',
          'Other',
        ],
      },
      {
        name: 'contactPerson',
        label: 'Point of Contact',
        type: 'text',
        placeholder: 'Jane Doe',
        icon: User,
        autoComplete: 'name',
        required: true,
      },
      {
        name: 'email',
        label: 'Company Email',
        type: 'email',
        placeholder: 'jane@acme.edu',
        icon: Mail,
        autoComplete: 'email',
        required: true,
      },
      {
        name: 'mobile',
        label: 'Contact Number',
        type: 'tel',
        placeholder: '9876543210',
        icon: Phone,
        autoComplete: 'tel',
        required: true,
      },
      {
        name: 'address',
        label: 'Organization Address',
        type: 'textarea',
        placeholder: 'Street, City, State, PIN',
        icon: Pin,
        required: true,
        full: true,
      },
      {
        name: 'requirements',
        label: 'Requirements / Goals',
        type: 'textarea',
        placeholder:
          'e.g. team size, focus areas, preferred timeline…',
        icon: Cube,
        required: false,
        full: true,
        optional: true,
      },
    ],
  },
}

// =========================
// Validation Regex
// =========================

export const emailRe =
/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|in|org|edu|io|net)$/i

export const mobileRe =
  /^[6-9]\d{9}$/

export const nameRe =
  /^[A-Za-z\s]+$/

export const organizationRe =
/^[A-Za-z\s]+$/
// =========================
// Empty Form
// =========================

export const emptyFormFor = (cfg) =>
  cfg.fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {})

// =========================
// Validation
// =========================

export function validateForm(cfg, form) {
  const errors = {}

  for (const f of cfg.fields) {
    const val = (form[f.name] || '').trim()

    // Required validation
    if (f.required && !val) {
      errors[f.name] = `${f.label} is required`
      continue
    }

    if (!val) continue

    switch (f.name) {
      case 'firstName':
      case 'lastName':
      case 'contactPerson':
        if (!nameRe.test(val)) {
          errors[f.name] =
            'Only alphabets and spaces are allowed'
        }
        break

      case 'Organization-College Name':
case 'organization':
    if (!organizationRe.test(val)) {
        errors[f.name] =
            'Only letters are allowed'
    }
    break

      case 'mobile':
        if (!mobileRe.test(val)) {
          errors[f.name] =
            'Enter a valid 10-digit mobile number'
        }
        break

      case 'email':
        if (!emailRe.test(val)) {
          errors[f.name] =
            'Enter a valid email address'
        }
        break

      default:
        break
    }
  }

  return errors
}
