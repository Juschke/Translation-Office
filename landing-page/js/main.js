// Translation Office Landing Page - Main JavaScript

window.addEventListener('scroll', function () {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    if (window.scrollY > 24) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function () {
        mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function () {
            mobileMenu.classList.add('hidden');
        });
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    });
});

function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function showFormMessage(message, type = 'success') {
    const form = document.querySelector('.lead-form.is-active') || document.querySelector('.lead-form');
    if (!form) return;

    const formContainer = form.parentElement;
    const existingMessage = formContainer.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`;
    messageDiv.textContent = message;
    formContainer.insertBefore(messageDiv, form.nextSibling);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

document.querySelectorAll('.lead-form').forEach(form => {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        document.querySelectorAll('.lead-form').forEach(item => item.classList.remove('is-active'));
        form.classList.add('is-active');

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            phone: formData.get('phone') || '',
            teamSize: formData.get('team_size') || '',
            reason: formData.get('reason') || '',
            message: formData.get('message') || ''
        };

        if (!isValidEmail(data.email)) {
            showFormMessage('Bitte geben Sie eine gueltige E-Mail-Adresse ein.', 'error');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner inline-block mr-2"></span> Wird gesendet...';

        setTimeout(() => {
            console.log('Lead request:', data);
            submitButton.innerHTML = 'Erfolgreich gesendet';
            submitButton.classList.add('bg-green-600', 'hover:bg-green-700');
            submitButton.classList.remove('bg-primary', 'hover:bg-primary-dark');

            showFormMessage('Vielen Dank. Wir melden uns zeitnah mit einem passenden Vorschlag.', 'success');
            form.reset();

            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                submitButton.classList.add('bg-primary', 'hover:bg-primary-dark');
            }, 3000);
        }, 1200);
    });
});

window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page loaded in ${pageLoadTime}ms`);
    }
});

console.log('Translation Office Landing Page loaded successfully.');
