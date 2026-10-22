# barakahvillah-making

বারাকাহ ভিলা হিসাব অ্যাপ। GitHub Pages থেকে চালাতে রিপোজিটরির **Settings → Pages** এ গিয়ে source হিসেবে **GitHub Actions** নির্বাচন করুন। `main` ব্রাঞ্চে পুশ হলে সাইটটি স্বয়ংক্রিয়ভাবে প্রকাশ হবে।

শিটের ডেটা লোড ও সিঙ্ক করতে:

1. Google Sheet-এর **Extensions → Apps Script** খুলে এই রিপোজিটরির [`code.gs`](./code.gs)-এর কোড ব্যবহার করুন।
2. **Deploy → Manage deployments → Edit → New version → Deploy** করে একই Web App URL-এর নতুন version প্রকাশ করুন। Access **Anyone** হতে হবে।
3. সেই Web App URL অ্যাপের Settings-এ সংরক্ষণ করুন। অ্যাপ চালুর সময় এবং refresh বাটনে শিটের এন্ট্রি লোড হবে।

অ্যাপটি মোবাইলে ব্যবহার করতে প্রকাশিত সাইটের লিংক Chrome-এ খুলে **Add to Home screen** নির্বাচন করুন। হিসাবের ডেটা এই ডিভাইসের browser storage-এ থাকে; ডিভাইস বদলালে ডেটা নিতে Settings-এর backup export/import ব্যবহার করুন।
