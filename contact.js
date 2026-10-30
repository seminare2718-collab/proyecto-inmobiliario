export function initContact(getInquiry) {
  const dialog = document.getElementById('contactDialog');
  const address = document.getElementById('contactAddress');
  const feedback = document.getElementById('contactFeedback');
  document.getElementById('contactBtn').addEventListener('click', () => {
    const { email, unit } = getInquiry();
    const recipient = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') ? email : 'seminare2718@gmail.com';
    const subject = `Consulta por ${unit} · Proyecto Inmobiliario`;
    const body = `Hola, me interesa ${unit} y quisiera consultar el precio y recibir más información.\n\nGracias.`;
    document.getElementById('contactTitle').textContent = `Consultar por ${unit}`;
    address.value = recipient;
    document.getElementById('contactMail').href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById('contactGmail').href = `https://mail.google.com/mail/?${new URLSearchParams({view: 'cm', fs: '1', to: recipient, su: subject, body})}`;
    feedback.textContent = '';
    dialog.showModal();
  });
  document.getElementById('copyContact').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address.value);
      feedback.textContent = 'Dirección de correo copiada.';
    } catch {
      address.focus(); address.select();
      feedback.textContent = 'Seleccionamos la dirección para que puedas copiarla.';
    }
  });
}
