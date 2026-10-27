/* Authentication is enforced again by Firestore rules / server authorization. */
(function(root) {
  'use strict';
  const allowed = new Set(['ezquerrahector@gmail.com', 'osmararobles@hotmail.com']);
  const normalize = email => String(email || '').trim().toLowerCase();
  const authorized = user => !!user && user.emailVerified === true && allowed.has(normalize(user.email));
  let auth, ready, resolveReady, overlay, message, account, started = false;
  const emailKey = 'instinto_signin_email';
  function status(text) { message.textContent = text; }
  function build() {
    overlay = document.createElement('section');
    overlay.id = 'instinto-access'; overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Acceso a INSTINTO');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#111;display:grid;place-items:center;color:#f0ede6;padding:24px;font-family:Arial,sans-serif';
    const box = document.createElement('div'); box.style.cssText = 'width:min(420px,100%);line-height:1.5';
    const title = document.createElement('h1'); title.textContent = 'INSTINTO';
    title.style.cssText = 'font-family:Cinzel,serif;letter-spacing:.15em;color:#c9a84c';
    box.append(title);
    const info = document.createElement('p'); info.textContent = 'Accede una vez en este navegador. Tu sesión se conservará para las próximas visitas.';box.append(info);
    const google = document.createElement('button'); google.textContent = 'Continuar con Google';
    google.onclick = async () => { try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch(e) { status(errorText(e)); } };box.append(google);
    const form = document.createElement('form'); form.style.marginTop = '24px';
    const label = document.createElement('label');label.textContent = 'O recibe un enlace de acceso en tu correo';
    const input = document.createElement('input'); input.type = 'email';input.required = true;input.autocomplete = 'email';input.id = 'instinto-access-email';label.htmlFor=input.id;
    input.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:12px;margin:10px 0';
    input.value = localStorage.getItem(emailKey) || '';
    const send = document.createElement('button');send.type = 'submit';send.textContent = 'Enviar enlace de acceso';
    form.append(label,input,send);box.append(form);
    form.onsubmit = async event => {
      event.preventDefault();const email=normalize(input.value);
      if(!allowed.has(email)){status('Este correo no tiene acceso autorizado.');return;}
      send.disabled=true;
      try {
        if(auth.isSignInWithEmailLink(location.href)) {
          await auth.signInWithEmailLink(email, location.href);
          history.replaceState(null,'',location.pathname);
        } else {
          await auth.sendSignInLinkToEmail(email, {url: location.origin + '/instinto-app/index.html', handleCodeInApp: true});
          localStorage.setItem(emailKey,email);
          status('Revisa tu correo y abre el enlace en este navegador. Tu sesión quedará guardada.');
        }
      } catch(e) {status(errorText(e));} finally {send.disabled=false;}
    };
    const change = document.createElement('button');change.textContent='Usar otra cuenta';
    change.style.marginTop='12px';change.onclick=()=>auth.signOut();box.append(change);
    message=document.createElement('p');message.setAttribute('role','status');box.append(message);
    overlay.append(box);document.body.append(overlay);
    account=document.createElement('button');account.textContent='Cerrar sesión';account.type='button';
    account.style.cssText='position:fixed;right:12px;bottom:12px;z-index:10000;padding:8px 12px;background:#1c1c1c;color:#c9a84c;border:1px solid #555;border-radius:6px;display:none';
    account.onclick=()=>auth.signOut();document.body.append(account);
  }
  function errorText(e) {
    if(e.code==='auth/popup-closed-by-user')return 'La ventana se cerró. Puedes volver a intentar cuando quieras.';
    if(e.code==='auth/operation-not-allowed')return 'Este método de acceso aún no está habilitado. Contacta al administrador.';
    if(e.code==='auth/invalid-action-code'||e.code==='auth/expired-action-code'){
      history.replaceState(null,'',location.pathname);
      return 'El enlace venció o ya se utilizó. Solicita uno nuevo.';
    }
    if(e.code==='auth/network-request-failed')return 'No fue posible conectar. Revisa tu conexión e inténtalo nuevamente.';
    return 'No fue posible iniciar sesión. Intenta nuevamente o usa el enlace por correo.';
  }
  async function start(instance) {
    if(started)return ready;
    started=true;auth=instance;ready=new Promise(resolve=>{resolveReady=resolve});build();
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged(user=>{
        if(authorized(user)) {
          overlay.style.display='none';resolveReady(user);
          account.style.display='block';
          window.dispatchEvent(new CustomEvent('instinto-auth-ready'));
        } else {
          overlay.style.display='grid';
          account.style.display='none';
          status(user?'Esta cuenta no tiene acceso autorizado. Cambia de cuenta.':'');
          window.dispatchEvent(new CustomEvent('instinto-auth-locked'));
        }
      });
      if(auth.isSignInWithEmailLink(location.href)) {
        const email=localStorage.getItem(emailKey);
        if(email && allowed.has(normalize(email))) {
          await auth.signInWithEmailLink(email,location.href);
          history.replaceState(null,'',location.pathname);
        } else status('Escribe el correo al que se envió este enlace para completar el acceso.');
      }
    } catch(e){status(errorText(e));}
    return ready;
  }
  async function requireUser() {
    await ready;
    if(!authorized(auth.currentUser))throw new Error('Inicia sesión con una cuenta autorizada.');
    return auth.currentUser;
  }
  root.InstintoAccess={start,requireUser,authorized,normalize};
})(window);
