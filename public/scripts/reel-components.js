// Data for your unique property cards
const propertyData = [
    {
        imgSrc: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Toorak",
        price: "$4,950,000",
        suburb: "Toorak, VIC"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Bondi",
        price: "$2,895,000",
        suburb: "Bondi, NSW"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1575517111478-7f6afd0973db?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Brighton",
        price: "$3,750,000",
        suburb: "Brighton, VIC"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Mosman",
        price: "$5,200,000",
        suburb: "Mosman, NSW"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in South Yarra",
        price: "$2,250,000",
        suburb: "South Yarra, VIC"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Double Bay",
        price: "$4,150,000",
        suburb: "Double Bay, NSW"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Cottesloe",
        price: "$3,295,000",
        suburb: "Cottesloe, WA"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Vaucluse",
        price: "$6,850,000",
        suburb: "Vaucluse, NSW"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in New Farm",
        price: "$1,950,000",
        suburb: "New Farm, QLD"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Albert Park",
        price: "$2,795,000",
        suburb: "Albert Park, VIC"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1592595896551-12b371d546d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Paddington",
        price: "$2,450,000",
        suburb: "Paddington, NSW"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Bulimba",
        price: "$1,750,000",
        suburb: "Bulimba, QLD"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Peppermint Grove",
        price: "$5,195,000",
        suburb: "Peppermint Grove, WA"
    },
    {
        imgSrc: "https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80",
        altText: "Property in Hawthorn",
        price: "$2,975,000",
        suburb: "Hawthorn, VIC"
    }
];

/**
 * Applies the needed inline styles to property card elements
 * @param {HTMLElement} card - The card element to style
 * @param {boolean} isSecondReeel - Whether this card is in the second reel
 */
function applyCardStyles(card, isSecondReeel) {
    // Card dimensions and basic styles
    const cardWidth = isSecondReeel ? 198 : 180; // 10% larger for second reel
    const cardHeight = isSecondReeel ? 165 : 150; // 10% larger for second reel
    
    // Image height 
    const imageHeight = isSecondReeel ? 99 : 90; // 10% larger for second reel
    
    // Shadow - deeper for second reel
    const shadowValue = isSecondReeel 
        ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
        : '0 2px 5px rgba(0, 0, 0, 0.1)';
    
    // Apply styles directly to the card element
    card.style.width = `${cardWidth}px`;
    card.style.height = `${cardHeight}px`;
    card.style.backgroundColor = '#fff';
    card.style.border = '1px solid #e0e0e0';
    card.style.borderRadius = '8px';
    card.style.marginRight = '15px';
    card.style.boxShadow = shadowValue;
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.overflow = 'hidden';
    card.style.flexShrink = '0';
    
    // Image container styles
    const imageContainer = card.querySelector('.property-image');
    imageContainer.style.width = '100%';
    imageContainer.style.height = `${imageHeight}px`;
    imageContainer.style.overflow = 'hidden';
    
    // Image styles
    const image = imageContainer.querySelector('img');
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    image.style.display = 'block';
    
    // Details section styles
    const detailsSection = card.querySelector('.property-details');
    detailsSection.style.padding = '8px';
    detailsSection.style.display = 'flex';
    detailsSection.style.flexDirection = 'column';
    detailsSection.style.justifyContent = 'center';
    detailsSection.style.flexGrow = '1';
    detailsSection.style.boxSizing = 'border-box';
    detailsSection.style.height = `${cardHeight - imageHeight}px`;
    detailsSection.style.textAlign = 'left';
    
    // Price text styles
    const priceText = detailsSection.querySelector('.property-price');
    priceText.style.fontSize = '0.95em';
    priceText.style.fontWeight = '600';
    priceText.style.color = '#333';
    priceText.style.margin = '0 0 2px 0';
    priceText.style.whiteSpace = 'normal';
    
    // Suburb text styles
    const suburbText = detailsSection.querySelector('.property-suburb');
    suburbText.style.fontSize = '0.8em';
    suburbText.style.color = '#666';
    suburbText.style.margin = '0';
    suburbText.style.whiteSpace = 'normal';
}

/**
 * Populates a reel container with property cards.
 * @param {string} containerSelector - CSS selector for the reel's content div.
 * @param {Array} data - The array of property data objects.
 * @param {number} duplicateCount - How many times to repeat the unique set of cards.
 */
function populatePropertyReel(containerSelector, data, duplicateCount = 8) {
    const container = document.querySelector(containerSelector);
    const template = document.getElementById('property-card-template');
    const isSecondReel = containerSelector.includes('property-reel-2');

    if (!container) {
        console.error(`Property reel container "${containerSelector}" not found.`);
        return;
    }
    if (!template) {
        console.error('Property card template with ID "property-card-template" not found.');
        return;
    }

    container.innerHTML = ''; // Clear any existing static cards

    // Ensure enough duplicates to fill the entire width (we need more cards for 100vw)
    // For wider viewports, we may need more duplicates
    let cardsToRender = [];
    for (let i = 0; i < duplicateCount; i++) {
        cardsToRender = cardsToRender.concat(data);
    }

    cardsToRender.forEach(prop => {
        const cardClone = template.content.cloneNode(true);
        const imgElement = cardClone.querySelector('.property-image img');
        imgElement.src = prop.imgSrc;
        imgElement.alt = prop.altText;
        // loading="lazy" is already in the template's img tag

        cardClone.querySelector('.property-price').textContent = prop.price;
        cardClone.querySelector('.property-suburb').textContent = prop.suburb;
        
        // Get the card element to apply styles
        const card = cardClone.querySelector('.property-card');
        
        // Apply styles directly to the card and its children
        applyCardStyles(card, isSecondReel);

        container.appendChild(cardClone);
    });
}

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Use more duplicates for wider screens
    const screenWidth = window.innerWidth;
    const duplicateCount = Math.max(8, Math.ceil(screenWidth / 500)); // Adjust based on card width
    
    const firstReelContentSelector = '#property-reel-1 .scrolling-wrapper .scrolling-content';
    populatePropertyReel(firstReelContentSelector, propertyData, duplicateCount);

    const secondReelContentSelector = '#property-reel-2 .scrolling-wrapper .scrolling-content-reverse';
    populatePropertyReel(secondReelContentSelector, propertyData, duplicateCount);
});