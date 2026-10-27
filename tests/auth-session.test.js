'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {readFileSync}=require('node:fs');
const source=readFileSync(require('node:path').join(__dirname,'../assets/admin-access.js'),'utf8');
function setup(user){
  const dom=new JSDOM('<body></body>',{url:'https://ezquerrahector.github.io/instinto-app/index.html',runScripts:'outside-only'});
  const events=[];let callback;
  const auth={currentUser:user,setPersistence:async mode=>{events.push(['persistence',mode])},
    onAuthStateChanged:cb=>{callback=cb;cb(user)},isSignInWithEmailLink:()=>false,
    signInWithPopup:async()=>{events.push(['popup'])},
    signOut:async()=>{auth.currentUser=null;callback(null)},
    sendSignInLinkToEmail:async(email,options)=>{events.push(['link',email,options])}};
  dom.window.firebase={auth:{Auth:{Persistence:{LOCAL:'local'}},GoogleAuthProvider:class{}}};
  dom.window.eval(source);
  return {dom,auth,events,access:dom.window.InstintoAccess};
}
test('existing verified session is retained with LOCAL and does not trigger another sign-in',async()=>{
  const s=setup({email:'osmararobles@hotmail.com',emailVerified:true});
  await s.access.start(s.auth);await s.access.start(s.auth);
  assert.deepEqual(s.events,[['persistence','local']]);
  assert.equal(s.dom.window.document.getElementById('instinto-access').style.display,'none');
  assert.equal((await s.access.requireUser()).email,'osmararobles@hotmail.com');s.dom.window.close();
});
test('explicit sign-out locks the UI and subsequent privileged requests',async()=>{
  const s=setup({email:'ezquerrahector@gmail.com',emailVerified:true});await s.access.start(s.auth);
  await s.auth.signOut();assert.equal(s.dom.window.document.getElementById('instinto-access').style.display,'grid');
  await assert.rejects(s.access.requireUser());s.dom.window.close();
});
test('unverified or foreign saved sessions do not unlock the application',async()=>{
  for(const user of [{email:'osmararobles@hotmail.com',emailVerified:false},{email:'stranger@example.com',emailVerified:true}]){
    const s=setup(user);s.access.start(s.auth);await Promise.resolve();
    assert.equal(s.access.authorized(user),false);assert.equal(s.dom.window.document.getElementById('instinto-access').style.display,'grid');s.dom.window.close();
  }
});
test('email-link login only sends on explicit form submit to an allowed address',async()=>{
  const s=setup(null);s.access.start(s.auth);await Promise.resolve();
  const input=s.dom.window.document.getElementById('instinto-access-email');
  input.value='unknown@example.com';await input.form.onsubmit({preventDefault(){}});
  assert.equal(s.events.filter(e=>e[0]==='link').length,0);
  input.value='osmararobles@hotmail.com';await input.form.onsubmit({preventDefault(){}});
  const link=s.events.find(e=>e[0]==='link');assert.equal(link[1],'osmararobles@hotmail.com');
  assert.equal(link[2].handleCodeInApp,true);assert.equal(link[2].url,'https://ezquerrahector.github.io/instinto-app/index.html');s.dom.window.close();
});
