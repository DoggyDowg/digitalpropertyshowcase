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
 * Populates a reel container with property cards.
 * @param {string} containerSelector - CSS selector for the reel's content div.
 * @param {Array} data - The array of property data objects.
 * @param {number} duplicateCount - How many times to repeat the unique set of cards.
 */
function populatePropertyReel(containerSelector, data, duplicateCount = 8) {
    const container = document.querySelector(containerSelector);
    const template = document.getElementById('property-card-template');

    if (!container) {
        console.error(`Property reel container "${containerSelector}" not found.`);
        return;
    }
    if (!template) {
        console.error('Property card template with ID "property-card-template" not found.');
        return;
    }

    container.innerHTML = ''; // Clear any existing static cards

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

        container.appendChild(cardClone);
    });
}

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    const firstReelContentSelector = '#property-reel-1 .scrolling-wrapper .scrolling-content';
    populatePropertyReel(firstReelContentSelector, propertyData);

    const secondReelContentSelector = '#property-reel-2 .scrolling-wrapper .scrolling-content-reverse';
    populatePropertyReel(secondReelContentSelector, propertyData);
});