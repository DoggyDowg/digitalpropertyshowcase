'use client';

import React, { useState, useEffect } from 'react';
import { FloatingDock } from '@/components/ui/floating-dock';
import { FacebookIcon } from '@/components/icons/FacebookIcon';
import { TwitterXIcon } from '@/components/icons/TwitterXIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Mail, Copy } from 'lucide-react';

interface SocialShareDockProps {
    property: {
        title?: string;
        name?: string;
    };
}

export const SocialShareDock = ({ property }: SocialShareDockProps) => {
    const [pageUrl, setPageUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setPageUrl(window.location.href);
    }, []);

    const propertyTitle = property.name || property.title || 'Check out this amazing property!';
    const shareText = `Check out this property: ${propertyTitle}`;

    const handleCopy = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigator.clipboard.writeText(pageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    const handleSocialShare = (url: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // Open in a new popup window for better user experience
        window.open(url, 'share', 'width=600,height=400,scrollbars=yes,resizable=yes');
    };

    const socialItems = [
        {
            title: 'Share on Facebook',
            icon: <FacebookIcon className="text-blue-600" />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
            onClick: handleSocialShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`),
        },
        {
            title: 'Share on X',
            icon: <TwitterXIcon className="text-black dark:text-white" />,
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
            onClick: handleSocialShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`),
        },
        {
            title: 'Share on WhatsApp',
            icon: <WhatsAppIcon className="text-green-500" />,
            href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`,
            onClick: handleSocialShare(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`),
        },
        {
            title: 'Share on LinkedIn',
            icon: <LinkedInIcon className="text-blue-700" />,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(propertyTitle)}`,
            onClick: handleSocialShare(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(propertyTitle)}`),
        },
        {
            title: 'Share via Email',
            icon: <Mail className="text-gray-600 dark:text-gray-400" />,
            href: `mailto:?subject=${encodeURIComponent(propertyTitle)}&body=${encodeURIComponent(`Check out this property: ${pageUrl}`)}`,
            // Email doesn't need onClick handler as it uses system default
        },
        {
            title: copied ? 'Link Copied!' : 'Copy Link to Share',
            icon: <Copy className={copied ? "text-green-500" : "text-gray-600 dark:text-gray-400"} />,
            href: pageUrl,
            onClick: handleCopy,
        },
    ];

    return <FloatingDock items={socialItems} />;
}; 