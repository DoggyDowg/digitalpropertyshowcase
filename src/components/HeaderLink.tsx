import Link from 'next/link'
import styles from '@/styles/HeaderLink.module.css'

interface HeaderLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  isDarkHeader?: boolean
}

export function HeaderLink({ href, children, className = '', isDarkHeader = false }: HeaderLinkProps) {
  // Determine if this is a hash link (e.g. #gallery)
  const isHashLink = href.startsWith('#')
  
  // Use same base class structure for all links
  const classes = `${styles.link} ${className} dynamic-hover`
  
  // Handle hash link click for smooth scrolling
  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  // If it's a hash link, use regular anchor with smooth scroll
  if (isHashLink) {
    return (
      <a 
        href={href} 
        className={classes} 
        onClick={handleHashLinkClick}
        data-hover="true"
        data-in-header="true"
        data-dark-header={isDarkHeader ? 'true' : 'false'}
      >
        {children}
      </a>
    )
  }
  
  // For external links
  if (href.startsWith('http')) {
    return (
      <a 
        href={href} 
        className={classes} 
        target="_blank" 
        rel="noopener noreferrer"
        data-hover="true"
        data-in-header="true"
        data-dark-header={isDarkHeader ? 'true' : 'false'}
      >
        {children}
      </a>
    )
  }
  
  // For Next.js links
  return (
    <Link 
      href={href} 
      className={classes}
      data-hover="true"
      data-in-header="true"
      data-dark-header={isDarkHeader ? 'true' : 'false'}
    >
      {children}
    </Link>
  )
} 