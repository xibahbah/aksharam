import { LETTER_A } from "./intro-glyph";

// Approved flat-figures-flower-v3 artwork; preserve its final geometry.
export const LEFT_FIGURE = "M 344 118  C 301 112 268 133 267 169  C 266 194 278 213 268 237  C 259 259 237 266 213 265  C 177 263 158 294 159 339  C 160 393 176 431 166 474  C 158 511 142 552 148 595  C 153 639 178 681 211 678  C 335.545 694.6 350.091 665.6 371 640  C 389 616 418 601 425 574  C 430 556 421 546 412 554  L 394 576  C 389 582 382 577 386 570  L 402 543  C 408 533 397 527 390 536  L 372 564  C 367 571 360 567 364 560  L 376 535  C 380 525 369 522 364 531  L 344.273 556.8  C 332.636 563.2 309.364 558 315.182 549.8  L 329.727 532.8  C 338.455 524 312.273 515.4 294.818 522  C 271.545 531.8 271.545 553.8 245.364 555.2  C 201.727 556.2 188 536 193 514  C 199 484 227 476 254 479  C 284 483 304 478 307 461  C 310 445 286 445 280 432  C 266 405 295 386 325 392  C 354 399 382 387 406 363  C 432 336 454 309 481 300  C 499 294 516 294 529 301  C 543 308 551 299 543 289  C 535 278 517 278 506 274  C 496 271 500 264 510 266  L 548 274  C 562 277 563 266 551 261  L 510 247  C 480 237 456 242 430 259  C 398 280 381 310 351 318  C 323 326 297 318 297 295  C 297 271 317 256 339 254  C 352 253 366 260 378 252  C 385 247 386 237 386 232  C 387 228 393 228 393 225 C 393 222 388 222 388 220 C 389 216 394 215 389 209  L 406 204  C 411 202 407 197 402 192  C 387 179 389 166 385 150  C 381 132 366 120 344 118 Z";
export const RIGHT_FIGURE = "M 826 118  C 791 114 766 128 761 153  C 757 173 754 183 744 193  C 737 199 734 204 742 207  L 754 211 C 750 215 750 218 754 219 C 758 221 758 223 754 225 C 750 228 755 231 760 235  C 760 250 771 256 789 253  C 813 249 831 261 831 278  C 830 297 810 302 790 295  C 755 283 719 267 689 279  C 667 288 650 311 660 327  C 667 338 681 332 688 321  C 699 307 718 308 736 320  C 765 339 763 376 786 396  C 805 414 831 407 836 386  C 842 361 817 341 821 321  C 825 299 858 300 878 319  C 909 349 912 379 892 405  C 869 436 877 460 894 483  C 908 503 899 522 877 522  C 842 521 813 503 787 484  C 761 465 741 442 725 426  C 715 415 705 419 710 432  L 724 456  C 729 466 721 470 713 465  L 681 443  C 670 436 662 445 671 454  L 700 479  C 706 485 701 491 693 487  L 663 471  C 652 465 647 476 657 483  L 685 500  C 694 506 690 513 680 509  L 656 501  C 643 497 640 508 651 514  C 674 525 701 525 724 522  C 757 518 777 536 804 552  C 839 573 878 591 912 577  C 949 562 947 525 933 491  C 920 460 926 434 939 397  C 954 354 954 310 932 285  C 918 269 899 272 880 264  C 859 254 862 222 864 194  C 867 155 858 122 826 118 Z";
export const BOAT = "M 89 548  C 129 578 139 638 194 675  C 260 717 337 711 397 683  C 449 659 461 644 486 649  C 513 655 514 676 551 688  C 615 709 704 691 761 659  C 807 633 815 592 853 584  C 870 580 885 581 899 567  C 938 575 959 538 977 512  C 1003 473 1039 449 1083 461  C 1041 481 1042 521 1030 559  C 1011 621 967 644 936 685  C 906 727 863 738 806 745  C 735 755 693 775 633 774  C 571 774 530 748 471 746  C 391 743 331 766 257 738  C 167 704 111 646 89 548 Z";

export const CREAM = "#f5f3dc";
export const COLORS = ["#b6322b", "#f16559", "#efb900", CREAM];
const polar = (radius: number, degrees: number, cx = 0, cy = 0) => {
  const angle = degrees * Math.PI / 180;
  return `${(cx + radius * Math.cos(angle)).toFixed(3)} ${(cy + radius * Math.sin(angle)).toFixed(3)}`;
};

// The three white paths share one star outline, then pull apart into the approved forms.
export function star(radius: number, cx = 0, cy = 0) {
  let d = `M ${polar(radius, -90, cx, cy)}`;
  for (let i = 0; i < 8; i++) {
    const angle = -90 + i * 45;
    d += ` Q ${polar(radius * .38, angle + 22.5, cx, cy)} ${polar(radius, angle + 45, cx, cy)}`;
  }
  return `${d} Z`;
}
// These paths use only coordinate commands (no arc flags).
export const scaleOutline = (d: string, scale: number) =>
  d.replace(/-?\d*\.?\d+/g, n => String(Number((Number(n) * scale).toFixed(3))));
const ASYMMETRIC_FLOWER = "M -23 -114.4 C .6 -117 12.2 -90.8 18.8 -71 C22 -66.4 29.2 -70.4 37.2 -72.4 C65.6 -80.6 86.6 -75.4 96 -56 C107 -37 96.8 -19 75.4 -5 C67.4 .6 69.4 6 76 12.2 C92 25.8 111.4 53.4 102.6 72.4 C94.4 97.8 59.8 98.6 34 86 C25.6 81 18.8 82.6 16.2 89.6 C4.6 114 -17 122.8 -35.4 108 C-46 99 -48.6 86.6 -48.6 80.6 C-50.2 68.2 -61.8 77.8 -86.4 76.8 C-108 75.2 -98 44.4 -86.2 29.6 C-78.8 20.8 -83 19.4 -88.2 14.8 C-112.4 -8.6 -104 -43.4 -82 -55.2 C-72.6 -60.6 -65 -58 -61.2 -58.2 C-57 -58.4 -58.8 -63.6 -59.2 -70.6 C-62 -94.4 -44 -113.6 -23 -114.4 Z";
const GOLD_CUSHION = "M -146 -68 C -123 -98 -83 -100 -48 -88 C -9 -106 27 -102 55 -84 C 88 -109 135 -101 156 -72 C 185 -36 178 34 162 65 C 140 94 108 98 78 81 C 49 78 32 111 3 94 C -24 91 -39 73 -58 82 C -116 109 -151 86 -157 57 C -179 22 -176 -35 -146 -68 Z";
export const FINAL_FLOWER = [
  scaleOutline(ASYMMETRIC_FLOWER, 1.8),
  scaleOutline(ASYMMETRIC_FLOWER, 1.8 * .77),
  scaleOutline(GOLD_CUSHION, .86),
  scaleOutline(LETTER_A, 1.06),
];

// The same unequal lobes grow throughout; no regular radial flower keyframe.
export function bloomPhase(scale: number, lean: number, stretch: number) {
  return ASYMMETRIC_FLOWER.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) => {
    const px = Number(x), py = Number(y);
    return `${((px + py * lean) * scale).toFixed(3)} ${(py * stretch * scale).toFixed(3)}`;
  });
}
export function coloredSeed(radius: number) {
  const radii = [1.08, .78, 1.02, .83, 1.13, .88, .92, .72];
  let d = `M ${polar(radius * radii[0], -90)}`;
  for (let i = 0; i < 8; i++) {
    const angle = -90 + i * 45;
    d += ` Q ${polar(radius * .38, angle + 22.5)} ${polar(radius * radii[(i + 1) % 8], angle + 45)}`;
  }
  return `${d} Z`;
}
