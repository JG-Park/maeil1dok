module.exports = {
  theme: {
    extend: {
      screens: {
        'tablet': '768px',      // iPad Mini and similar
        'tablet-lg': '1024px',  // iPad Pro and larger tablets
      },
      colors: {
        primary: {
          DEFAULT: '#61a375',
          dark: '#4B825C',
          light: '#E9F2EC'
        }
      },
      fontSize: {
        // Responsive font sizes for tablets
        'xs-tablet': ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm-tablet': ['0.9375rem', { lineHeight: '1.5rem' }],
        'base-tablet': ['1.0625rem', { lineHeight: '1.75rem' }],
        'lg-tablet': ['1.25rem', { lineHeight: '2rem' }],
        'xl-tablet': ['1.5rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        // Additional spacing options for tablets
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'tablet': '900px',
        'tablet-lg': '1200px',
      }
    }
  }
} 