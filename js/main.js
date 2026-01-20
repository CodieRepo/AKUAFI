document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '90px'; /* Match new header height */
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#0A66C2';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });
    }

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerText = 'Sending...';
            btn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                btn.innerText = 'Message Sent!';
                btn.style.backgroundColor = '#10B981';
                btn.style.borderColor = '#10B981';
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = '';
                    btn.style.borderColor = '';
                }, 3000);
            }, 1500);
        });
    }
    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.service-card, .pricing-card, .stat-item, .hero-content, .section-header, .cta-section h2, .cta-section p, .contact-wrapper');
    
    // Add reveal class to these elements initially
    revealElements.forEach((el) => {
        el.classList.add('reveal');
    });

    // Stagger grid items specially
    const grids = document.querySelectorAll('.services-grid, .pricing-grid, .stats-grid');
    grids.forEach(grid => {
        const children = grid.children;
        Array.from(children).forEach((child, index) => {
            child.classList.add('reveal');
            // Add slight delay based on index (0, 100ms, 200ms)
            if (index === 1) child.classList.add('reveal-delay-100');
            if (index === 2) child.classList.add('reveal-delay-200');
            if (index === 3) child.classList.add('reveal-delay-300');
        });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% visible
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
});
