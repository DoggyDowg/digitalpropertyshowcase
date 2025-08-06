// Pricing data used by index.html and onboarding.html
const pricingData = {
    demonstration: {
        price: 'AU$189',
        setupFee: 'Showcase will be live for 12 months'
    },
    showcase: {
        price: 'AU$549',
        setupFee: 'Covers 3 months of hosting, then AU$75/month if your campaign lasts longer'
    },
    enterprise: {
        price: 'Custom',
        setupFee: 'Custom solutions for larger agencies with high volume needs'
    }
};

// Export for global use (satisfies linter)
if (typeof window !== 'undefined') {
    window.pricingData = pricingData;
}