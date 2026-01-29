import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Language } from '../types';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    lang: Language;
    type?: 'website' | 'article' | 'book';
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image = '/og-image.jpg',
    url = 'https://kids.genarabi.com',
    lang,
    type = 'website'
}) => {
    const siteName = lang === 'ar' ? 'جين عربي' : 'Jeen Arabi';
    const fullTitle = `${title} | ${siteName}`;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <html lang={lang} dir={dir} />
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
            
            {/* SEO & Robots */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <meta name="googlebot" content="index, follow" />
            <meta name="bingbot" content="index, follow" />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content={lang === 'ar' ? 'ar_SA' : lang === 'fr' ? 'fr_FR' : 'en_US'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Canonical & Alternates */}
            <link rel="canonical" href={url} />
            <link rel="alternate" hrefLang="ar" href="https://kids.genarabi.com/?lang=ar" />
            <link rel="alternate" hrefLang="en" href="https://kids.genarabi.com/?lang=en" />
            <link rel="alternate" hrefLang="fr" href="https://kids.genarabi.com/?lang=fr" />
            <link rel="alternate" hrefLang="x-default" href="https://kids.genarabi.com/" />
        </Helmet>
    );
};
