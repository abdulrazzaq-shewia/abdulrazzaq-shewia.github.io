"use strict";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.querySelector(".sr-only").textContent = "Open navigation";
  navigation.classList.remove("open");
}
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector(".sr-only").textContent = open ? "Close navigation" : "Open navigation";
  navigation.classList.toggle("open", open);
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".site-header")) closeMenu();
});

// Enhance the existing sections on small screens; without JS, all content stays visible.
const mobileSectionsMedia = window.matchMedia("(max-width: 700px)");
const sectionAccordions = [...document.querySelectorAll("main > section[data-accordion-label]")].map((section, index) => {
  const panel = document.createElement("div");
  panel.id = `${section.id}-panel`;
  panel.className = "accordion-panel";
  panel.append(...section.childNodes);

  const heading = document.createElement("h2");
  heading.className = "accordion-heading";
  heading.hidden = true;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "accordion-trigger";
  button.id = `${section.id}-toggle`;
  button.setAttribute("aria-controls", panel.id);
  button.setAttribute("aria-expanded", "true");
  const number = document.createElement("span");
  number.className = "accordion-number";
  number.textContent = String(index + 1).padStart(2, "0");
  number.setAttribute("aria-hidden", "true");
  const copy = document.createElement("span");
  copy.className = "accordion-copy";
  const label = document.createElement("span");
  label.className = "accordion-label";
  label.textContent = section.dataset.accordionLabel;
  const description = document.createElement("span");
  description.className = "accordion-description";
  description.textContent = section.dataset.accordionDescription;
  copy.append(label, description);
  const indicator = document.createElement("span");
  indicator.className = "accordion-indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
  button.append(number, copy, indicator);
  heading.append(button);
  section.append(heading, panel);
  section.classList.add("portfolio-section");
  return { section, heading, button, panel, originalLabel: section.getAttribute("aria-labelledby") };
});

const mobileProfileCards = [document.querySelector(".focus-card"), document.querySelector("#profile-highlights")].map(element => {
  const anchor = document.createComment("Desktop profile card position");
  element.before(anchor);
  return { element, anchor };
});
let expandedSection = null;

function accordionForHash(hash) {
  let target;
  try {
    target = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
  return target ? sectionAccordions.find(item => item.section === target || item.panel.contains(target)) : null;
}

function expandMobileSection(selected) {
  expandedSection = selected;
  sectionAccordions.forEach(item => {
    const expanded = item === selected;
    // Move focus out of content that is about to disappear (for in-page links).
    if (!expanded && item.panel.contains(document.activeElement)) {
      (selected?.button ?? item.button).focus({ preventScroll: true });
    }
    item.panel.hidden = !expanded;
    item.button.setAttribute("aria-expanded", String(expanded));
  });
}

function applyMobileSections(mobile) {
  const focusedSection = sectionAccordions.find(item => item.panel.contains(document.activeElement));
  document.documentElement.classList.toggle("mobile-accordion", mobile);
  sectionAccordions.forEach(item => {
    item.heading.hidden = !mobile;
    item.section.setAttribute("aria-labelledby", mobile ? item.button.id : item.originalLabel);
    if (!mobile) {
      item.panel.hidden = false;
      item.button.setAttribute("aria-expanded", "true");
      if (document.activeElement === item.button) {
        navigation.querySelector(`a[href="#${item.section.id}"]`)?.focus({ preventScroll: true });
      }
    }
  });
  const aboutPanel = document.querySelector("#about-panel");
  mobileProfileCards.forEach(({ element, anchor }) => {
    if (mobile) aboutPanel.append(element);
    else anchor.after(element);
  });
  if (mobile) expandMobileSection(focusedSection ?? expandedSection ?? accordionForHash(window.location.hash));
}

sectionAccordions.forEach(item => {
  item.button.addEventListener("click", () => {
    if (!mobileSectionsMedia.matches) return;
    const opening = item.panel.hidden;
    expandMobileSection(opening ? item : null);
    if (opening) {
      requestAnimationFrame(() => {
        const headerBottom = document.querySelector(".site-header").getBoundingClientRect().bottom;
        if (item.button.getBoundingClientRect().top < headerBottom) {
          item.section.scrollIntoView({ block: "start" });
        }
      });
    }
  });
  item.button.addEventListener("keydown", event => {
    const index = sectionAccordions.indexOf(item);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % sectionAccordions.length;
    else if (event.key === "ArrowUp") next = (index - 1 + sectionAccordions.length) % sectionAccordions.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = sectionAccordions.length - 1;
    else return;
    event.preventDefault();
    sectionAccordions[next].button.focus();
  });
});

document.addEventListener("click", event => {
  if (!mobileSectionsMedia.matches || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = accordionForHash(link.getAttribute("href"));
  if (target) expandMobileSection(target);
  else if (link.getAttribute("href") === "#home") expandMobileSection(null);
});
window.addEventListener("hashchange", () => {
  if (!mobileSectionsMedia.matches) return;
  const target = accordionForHash(window.location.hash);
  if (target) expandMobileSection(target);
  else if (window.location.hash === "#home") expandMobileSection(null);
});
mobileSectionsMedia.addEventListener("change", event => applyMobileSections(event.matches));
window.addEventListener("beforeprint", () => applyMobileSections(false));
window.addEventListener("afterprint", () => applyMobileSections(mobileSectionsMedia.matches));
applyMobileSections(mobileSectionsMedia.matches);
if (mobileSectionsMedia.matches) {
  const initialSection = accordionForHash(window.location.hash);
  if (initialSection) requestAnimationFrame(() => initialSection.section.scrollIntoView({ block: "start" }));
}

const projects = {
  campusgear: {
    title: "CampusGear Equipment Checkout System",
    category: "01 / Networking & software · Academic project",
    summary: "A TCP client-server system that centralizes equipment inventory and supports viewing, checking out, returning, and tracking equipment.",
    tags: ["Python", "TCP sockets", "JSON", "Application protocol"],
    sections: [
      { title: "The problem", text: "Shared equipment needs a consistent way to record what is available and keep checkout and return operations connected to the same inventory." },
      { title: "What I implemented", items: ["A command-line client that communicates with a TCP server.", "Server-managed inventory with view, checkout, return, and tracking operations.", "A JSON-based application protocol with message framing.", "Request validation, structured error handling, and graceful connection handling."] },
      { title: "Skills demonstrated", text: "Socket programming, protocol design, client-server architecture, structured data exchange, and handling invalid requests and connection events." },
      { title: "Shown in the walkthrough", text: "The client connects to the server, shows available equipment, checks out an Arduino Uno and a DSLR camera, lists equipment marked CHECKED_OUT, and confirms a successful camera return." }
    ],
    galleryTitle: "Terminal walkthrough",
    galleryLayout: "terminal",
    screens: [
      { src: "assets/campusgear/connection-checkout.png", label: "Connect", caption: "Server connection & Arduino checkout", alt: "CampusGear client connected to localhost port 5050, showing its menu and a successful Arduino Uno checkout", width: 1132, height: 1188 },
      { src: "assets/campusgear/inventory.png", label: "Inventory", caption: "Available equipment inventory", alt: "CampusGear command-line inventory listing available laptops, electronics, audio equipment, and a camera", width: 1408, height: 1174 },
      { src: "assets/campusgear/camera-checkout.png", label: "Checkout", caption: "Successful camera checkout", alt: "CampusGear client confirming a successful DSLR camera checkout before opening the My Equipment view", width: 1394, height: 1210 },
      { src: "assets/campusgear/equipment-return.png", label: "Return", caption: "Checked-out equipment & camera return", alt: "CampusGear lists an Arduino Uno and DSLR camera as checked out, then confirms the camera was returned successfully", width: 1400, height: 1234 }
    ],
    repo: "https://github.com/abdulrazzaq-shewia/CampusGear-Equipment-Checkout"
  },
  daleel: {
    title: "Daleel Mobile Application",
    category: "02 / Cross-platform mobile development",
    summary: "An Arabic mobile directory for Yemenis in Egypt, built with Flutter and Dart. It organizes community services and everyday information through category, listing, and detail views.",
    tags: ["Flutter", "Dart", "Arabic / RTL UI", "Reusable components"],
    sections: [
      { title: "Application experience", items: ["Browse community services, administrative document guidance, medical specialties, addresses, and housing listings.", "Open service detail views with addresses and contact, sharing, and feedback actions.", "Navigate an Arabic interface with right-to-left layouts."] },
      { title: "What I implemented", items: ["A cross-platform mobile application using Flutter and Dart.", "Reusable UI components and an organized project architecture.", "Application logic, input handling, and mobile UI functionality."] }
    ],
    screens: [
      { src: "assets/daleel/home.png", label: "Home", caption: "Home & service categories", alt: "Daleel home screen in Arabic, showing community service categories", width: 572, height: 1100 },
      { src: "assets/daleel/documents.png", label: "Documents", caption: "Administrative document guidance", alt: "Arabic list of administrative procedures and required documents in Daleel", width: 574, height: 1122 },
      { src: "assets/daleel/medical.png", label: "Medical", caption: "Medical specialties", alt: "Daleel medical directory with categories for medical specialties", width: 566, height: 1092 },
      { src: "assets/daleel/service-details.png", label: "Details", caption: "Service details & contact actions", alt: "Daleel service detail screen showing a medical laboratory address and contact, sharing, and feedback buttons", width: 558, height: 1084 },
      { src: "assets/daleel/addresses.png", label: "Addresses", caption: "Address categories", alt: "Daleel address categories for embassies, airlines, hospitals, universities, theaters, and cinemas", width: 582, height: 1086 },
      { src: "assets/daleel/housing.png", label: "Housing", caption: "Real estate listings", alt: "Arabic list of real estate offices and services in Daleel", width: 590, height: 1162 },
      { src: "assets/daleel/welcome.jpg", label: "Welcome", caption: "Welcome screen", alt: "Daleel welcome screen with its orange logo and Arabic introduction for Yemenis in Egypt", width: 1049, height: 2048 }
    ],
    repo: "https://github.com/abdulrazzaq-shewia/Daleel"
  },
  security: {
    title: "Secure Software & Infrastructure Labs",
    category: "03 / Academic & self-directed learning",
    summary: "Hands-on exercises that connect secure coding practices with basic cloud infrastructure and access control concepts.",
    tags: ["C++", "Python", "OWASP guidelines", "Cloud foundations", "Access control"],
    sections: [
      { title: "Secure software exercises", text: "Applied secure coding practices in C++ and Python to address vulnerabilities such as SQL injection and buffer overflows." },
      { title: "Infrastructure & access control", text: "Configured basic cloud infrastructure and evaluated access control policies against security best practices." },
      { title: "Skills demonstrated", text: "Recognizing common application vulnerabilities, thinking about input handling and safe implementation, and connecting access decisions to infrastructure security." }
    ],
    repo: null
  }
};

const dialog = document.querySelector("#project-dialog");
const dialogClose = document.querySelector("#project-dialog .dialog-close");
const projectGallery = document.querySelector("#project-gallery");
const galleryImage = document.querySelector("#gallery-image");
const galleryError = document.querySelector("#gallery-error");
const galleryThumbnails = document.querySelector("#gallery-thumbnails");
let activeScreens = [];
let activeProjectButton = null;

function selectProjectScreen(index) {
  const screen = activeScreens[index];
  if (!screen) return;
  galleryError.hidden = true;
  galleryImage.hidden = false;
  galleryImage.alt = screen.alt;
  galleryImage.width = screen.width;
  galleryImage.height = screen.height;
  galleryImage.src = screen.src;
  document.querySelector("#gallery-caption").textContent = screen.caption;
  document.querySelector("#gallery-count").textContent = `${index + 1} / ${activeScreens.length}`;
  const fullImage = document.querySelector("#gallery-full-image");
  fullImage.href = screen.src;
  fullImage.setAttribute("aria-label", `Open full image: ${screen.caption} (new tab)`);
  [...galleryThumbnails.children].forEach((button, buttonIndex) => {
    button.setAttribute("aria-pressed", String(buttonIndex === index));
  });
}

function setProjectGallery(screens = [], title = "Application screens", layout = "mobile") {
  activeScreens = screens;
  projectGallery.hidden = screens.length === 0;
  dialog.classList.toggle("has-gallery", screens.length > 0);
  dialog.classList.toggle("gallery-terminal", screens.length > 0 && layout === "terminal");
  document.querySelector("#gallery-title").textContent = title;
  galleryThumbnails.replaceChildren(...screens.map((screen, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-thumbnail";
    button.setAttribute("aria-label", `Show screen ${index + 1}: ${screen.caption}`);
    button.setAttribute("aria-controls", "gallery-image");
    const thumbnail = document.createElement("img");
    thumbnail.src = screen.src;
    thumbnail.alt = "";
    thumbnail.width = screen.width;
    thumbnail.height = screen.height;
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    const label = document.createElement("span");
    label.textContent = screen.label;
    button.append(thumbnail, label);
    button.addEventListener("click", () => selectProjectScreen(index));
    return button;
  }));
  galleryThumbnails.scrollLeft = 0;
  if (screens.length > 0) selectProjectScreen(0);
  else galleryImage.removeAttribute("src");
}

galleryImage.addEventListener("error", () => {
  galleryImage.hidden = true;
  galleryError.hidden = false;
});
galleryThumbnails.addEventListener("keydown", event => {
  const focusedButton = event.target.closest(".gallery-thumbnail");
  const focusedIndex = [...galleryThumbnails.children].indexOf(focusedButton);
  if (focusedIndex < 0 || activeScreens.length === 0) return;
  let nextIndex;
  if (event.key === "ArrowRight") nextIndex = (focusedIndex + 1) % activeScreens.length;
  else if (event.key === "ArrowLeft") nextIndex = (focusedIndex - 1 + activeScreens.length) % activeScreens.length;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = activeScreens.length - 1;
  else return;
  event.preventDefault();
  selectProjectScreen(nextIndex);
  galleryThumbnails.children[nextIndex].focus();
});

document.querySelectorAll("[data-project]").forEach(button => {
  button.addEventListener("click", () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    activeProjectButton = button;
    document.querySelector("#dialog-title").textContent = project.title;
    document.querySelector("#dialog-category").textContent = project.category;
    document.querySelector("#dialog-summary").textContent = project.summary;
    document.querySelector("#dialog-tags").replaceChildren(...project.tags.map(tag => {
      const element = document.createElement("span");
      element.textContent = tag;
      return element;
    }));
    document.querySelector("#dialog-details").replaceChildren(...project.sections.map(section => {
      const wrapper = document.createElement("section");
      const title = document.createElement("h3");
      title.textContent = section.title;
      wrapper.append(title);
      if (section.items) {
        const list = document.createElement("ul");
        section.items.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item;
          list.append(li);
        });
        wrapper.append(list);
      } else {
        const text = document.createElement("p");
        text.textContent = section.text;
        wrapper.append(text);
      }
      return wrapper;
    }));
    const repoLink = document.querySelector("#dialog-repo");
    repoLink.hidden = !project.repo;
    if (project.repo) repoLink.href = project.repo;
    else repoLink.removeAttribute("href");
    setProjectGallery(project.screens, project.galleryTitle, project.galleryLayout);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("modal-open");
    dialogClose.focus();
  });
});
dialogClose.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  activeProjectButton?.focus();
});

const certificates = {
  ccsk: { title: "Certificate of Cloud Security Knowledge v5", meta: "Cloud Security Alliance · Completed June 26, 2026", src: "assets/certificates/ccsk-v5.png", width: 1576, height: 1222, verify: "https://www.credly.com/badges/91ec2955-dacf-40bc-80f5-7780cbc44e39/public_url" },
  "aws-essentials": { title: "AWS Cloud Technical Essentials", meta: "Amazon Web Services · Coursera · December 24, 2025", src: "assets/certificates/aws-cloud-technical-essentials.jpeg", width: 2000, height: 1536, verify: "https://coursera.org/verify/KTBOJES4VG7S" },
  "secure-software": { title: "Developing Secure Software (LFD121)", meta: "Linux Foundation · OpenSSF · August 27, 2024", src: "assets/certificates/developing-secure-software.jpeg", width: 986, height: 761, verify: "https://www.credly.com/badges/afab6669-c782-4ca8-bcae-4c3fb0bd6884/public_url" },
  "google-it": { title: "Google IT Support Professional Certificate", meta: "Google · Coursera · January 6, 2025", src: "assets/certificates/google-it-support.jpeg", width: 983, height: 765, verify: "https://www.credly.com/badges/0a034e27-819e-4b7d-871f-b89dd96c325d/public_url" },
  "google-ux": { title: "Google UX Design Professional Certificate", meta: "Google · Coursera · November 5, 2024", src: "assets/certificates/google-ux-design.jpeg", width: 988, height: 766, verify: "https://www.credly.com/badges/5dbaaf90-5a15-41e5-af0c-8ba04f4b9d5b/public_url" },
  "mobile-development": { title: "Mobile Application Development", meta: "Russian Cultural Center · 2017", src: "assets/certificates/mobile-application-development.jpeg", width: 824, height: 631 },
  "motion-graphics": { title: "Motion Graphics Diploma", meta: "Russian Cultural Center · 2015", src: "assets/certificates/motion-graphics-diploma.jpeg", width: 830, height: 626 }
};

const certificateDialog = document.querySelector("#certificate-dialog");
const certificateClose = certificateDialog.querySelector(".dialog-close");
const certificateImage = document.querySelector("#certificate-image");
let activeCertificateButton = null;
document.querySelectorAll("[data-certificate]").forEach(button => {
  button.addEventListener("click", () => {
    const certificate = certificates[button.dataset.certificate];
    if (!certificate) return;
    activeCertificateButton = button;
    document.querySelector("#certificate-title").textContent = certificate.title;
    document.querySelector("#certificate-meta").textContent = certificate.meta;
    document.querySelector("#certificate-error").hidden = true;
    certificateImage.hidden = false;
    certificateImage.alt = `${certificate.title} awarded to Abdulrazzaq Shewia`;
    certificateImage.width = certificate.width;
    certificateImage.height = certificate.height;
    certificateImage.src = certificate.src;
    document.querySelector("#certificate-full-image").href = certificate.src;
    const verifyLink = document.querySelector("#certificate-verify");
    verifyLink.hidden = !certificate.verify;
    if (certificate.verify) verifyLink.href = certificate.verify;
    else verifyLink.removeAttribute("href");
    certificateDialog.showModal();
    certificateDialog.scrollTop = 0;
    document.body.classList.add("modal-open");
    certificateClose.focus();
  });
});
certificateImage.addEventListener("error", () => {
  certificateImage.hidden = true;
  document.querySelector("#certificate-error").hidden = false;
});
certificateClose.addEventListener("click", () => certificateDialog.close());
certificateDialog.addEventListener("click", event => {
  if (event.target !== certificateDialog) return;
  const bounds = certificateDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) certificateDialog.close();
});
certificateDialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  activeCertificateButton?.focus();
});

const emailDialog = document.querySelector("#email-dialog");
const emailDialogClose = document.querySelector("#email-dialog .dialog-close");
const emailDestination = document.querySelector("#email-destination");
let activeEmailButton = null;

function openEmailOptions(button) {
  activeEmailButton = button;
  document.querySelector("#email-copy-feedback").textContent = "";
  emailDialog.showModal();
  document.body.classList.add("modal-open");
  emailDialog.querySelector(".email-service").focus();
}

document.querySelectorAll("[data-email-compose]").forEach(button => {
  button.addEventListener("click", () => openEmailOptions(button));
});
emailDialogClose.addEventListener("click", () => emailDialog.close());
emailDialog.addEventListener("click", event => {
  if (event.target !== emailDialog) return;
  const bounds = emailDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) emailDialog.close();
});
emailDialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  activeEmailButton?.focus();
});
emailDestination.addEventListener("focus", () => emailDestination.select());

document.querySelectorAll("[data-copy-email]").forEach(button => {
  button.addEventListener("click", async () => {
    const feedback = document.querySelector(button.dataset.feedback);
    feedback.textContent = "";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(emailDestination.value);
      feedback.textContent = "Email address copied.";
    } catch {
      if (!emailDialog.open) openEmailOptions(button);
      emailDestination.focus();
      emailDestination.select();
      document.querySelector("#email-copy-feedback").textContent = "Copy the selected address with Ctrl+C (Windows) or ⌘C (Mac).";
    }
  });
});

if ("IntersectionObserver" in window) {
  const sectionLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach(link => {
        const active = link.getAttribute("href") === "#" + entry.target.id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-15% 0px -60% 0px", threshold: 0 });
  document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
}
