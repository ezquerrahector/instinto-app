'use strict';
const ALLOWED_EMAILS = new Set(['ezquerrahector@gmail.com','osmararobles@hotmail.com']);
function isAllowedIdentity(identity) {
  return !!identity && identity.email_verified === true &&
    ALLOWED_EMAILS.has(String(identity.email || '').trim().toLowerCase());
}
module.exports={isAllowedIdentity};
