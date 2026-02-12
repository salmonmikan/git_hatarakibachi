export function returnPhotoUrl(photoUrl, size, gravity) {
    return photoUrl ? `https://public.hatarakibachi.com/cdn-cgi/image/w=${size},h=${size},gravity=${gravity},fit=cover,f=auto,q=80/${photoUrl}` : '';
};