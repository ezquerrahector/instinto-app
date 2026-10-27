'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isAllowedIdentity}=require('../store-api/access');
test('Google and email-link access support the two authorized verified emails',()=>{
  assert.equal(isAllowedIdentity({email:'ezquerrahector@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}}),true);
  assert.equal(isAllowedIdentity({email:'osmararobles@hotmail.com',email_verified:true,firebase:{sign_in_provider:'password'}}),true);
});
test('matching email without verification and unrelated identities are denied',()=>{
  assert.equal(isAllowedIdentity({email:'osmararobles@hotmail.com',email_verified:false}),false);
  assert.equal(isAllowedIdentity({email:'unlisted@gmail.com',email_verified:true}),false);
  assert.equal(isAllowedIdentity(null),false);
});
