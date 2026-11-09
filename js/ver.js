/* Version til A/B-test: ?v=a (standard i dette repo) = nuværende struktur, ?v=b = opgavebaseret struktur, ?v=c = nyt design med valgaften, kredse og kandidater, ?v=d = helt nyt design («Sætningen»).
   Valget huskes i fanen (sessionStorage), så det følger deltageren gennem hele testen. */
(function () {
  var v = null;
  try {
    v = new URLSearchParams(location.search).get('v');
    if (v === 'a' || v === 'b' || v === 'c' || v === 'd') sessionStorage.setItem('valgVer', v); else v = sessionStorage.getItem('valgVer');
  } catch (e) {}
  window.VVER = v === 'a' ? 'a' : v === 'c' ? 'c' : v === 'd' ? 'd' : 'a'; // standard = a i dette repo (version A til A/B-testen)
})();
