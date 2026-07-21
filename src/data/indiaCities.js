// Cities per state/UT for the registration form's dependent City dropdown.
// Keeping City a fixed list (not free text) is what prevents spelling-variant
// duplicates. This covers major cities + district headquarters for every state
// and UT — the places colleges actually are. To add a missing city, just drop
// it into the relevant array (keep the list alphabetical).

export const STATE_CITIES = {
  'Andhra Pradesh': [
    'Adoni', 'Amaravati', 'Anantapur', 'Chittoor', 'Eluru', 'Guntur', 'Kadapa', 'Kakinada', 'Kurnool',
    'Machilipatnam', 'Nandyal', 'Nellore', 'Ongole', 'Proddatur', 'Rajahmundry', 'Srikakulam', 'Tenali',
    'Tirupati', 'Vijayawada', 'Visakhapatnam', 'Vizianagaram',
  ],
  'Arunachal Pradesh': [
    'Along', 'Bomdila', 'Itanagar', 'Khonsa', 'Naharlagun', 'Pasighat', 'Roing', 'Tawang', 'Tezu', 'Ziro',
  ],
  Assam: [
    'Barpeta', 'Bongaigaon', 'Dhubri', 'Dibrugarh', 'Diphu', 'Goalpara', 'Guwahati', 'Jorhat', 'Karimganj',
    'Nagaon', 'Nalbari', 'North Lakhimpur', 'Silchar', 'Sivasagar', 'Tezpur', 'Tinsukia',
  ],
  Bihar: [
    'Arrah', 'Begusarai', 'Bettiah', 'Bhagalpur', 'Bihar Sharif', 'Chhapra', 'Darbhanga', 'Gaya', 'Hajipur',
    'Katihar', 'Kishanganj', 'Motihari', 'Munger', 'Muzaffarpur', 'Nawada', 'Patna', 'Purnia', 'Saharsa',
    'Sasaram', 'Siwan',
  ],
  Chhattisgarh: [
    'Ambikapur', 'Bhilai', 'Bilaspur', 'Dhamtari', 'Durg', 'Jagdalpur', 'Kanker', 'Korba', 'Mahasamund',
    'Raigarh', 'Raipur', 'Rajnandgaon',
  ],
  Goa: ['Bicholim', 'Cuncolim', 'Curchorem', 'Mapusa', 'Margao', 'Panaji', 'Ponda', 'Vasco da Gama'],
  Gujarat: [
    'Ahmedabad', 'Anand', 'Bharuch', 'Bhavnagar', 'Gandhidham', 'Gandhinagar', 'Godhra', 'Jamnagar', 'Junagadh',
    'Mehsana', 'Morbi', 'Nadiad', 'Navsari', 'Palanpur', 'Porbandar', 'Rajkot', 'Surat', 'Surendranagar',
    'Vadodara', 'Valsad', 'Vapi',
  ],
  Haryana: [
    'Ambala', 'Bahadurgarh', 'Bhiwani', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jind', 'Kaithal',
    'Karnal', 'Kurukshetra', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat',
    'Yamunanagar',
  ],
  'Himachal Pradesh': [
    'Baddi', 'Bilaspur', 'Chamba', 'Dharamshala', 'Hamirpur', 'Kangra', 'Kullu', 'Manali', 'Mandi', 'Nahan',
    'Palampur', 'Shimla', 'Solan', 'Una',
  ],
  Jharkhand: [
    'Bokaro', 'Chaibasa', 'Deoghar', 'Dhanbad', 'Dumka', 'Giridih', 'Hazaribagh', 'Jamshedpur', 'Medininagar',
    'Phusro', 'Ramgarh', 'Ranchi', 'Sahibganj',
  ],
  Karnataka: [
    'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru', 'Bidar', 'Chikkamagaluru', 'Chitradurga', 'Davanagere',
    'Gadag', 'Hassan', 'Hospet', 'Hubballi', 'Kalaburagi', 'Karwar', 'Kolar', 'Mandya', 'Mangaluru', 'Mysuru',
    'Raichur', 'Shivamogga', 'Tumakuru', 'Udupi', 'Vijayapura',
  ],
  Kerala: [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kochi', 'Kollam', 'Kottayam', 'Kozhikode',
    'Malappuram', 'Manjeri', 'Palakkad', 'Pathanamthitta', 'Thalassery', 'Thiruvananthapuram', 'Thrissur',
    'Wayanad',
  ],
  'Madhya Pradesh': [
    'Betul', 'Bhopal', 'Burhanpur', 'Chhindwara', 'Damoh', 'Dewas', 'Gwalior', 'Hoshangabad', 'Indore',
    'Jabalpur', 'Katni', 'Khandwa', 'Mandsaur', 'Morena', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Shivpuri',
    'Singrauli', 'Ujjain', 'Vidisha',
  ],
  Maharashtra: [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Chandrapur', 'Dhule', 'Ichalkaranji', 'Jalgaon',
    'Kalyan', 'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nanded', 'Nashik', 'Navi Mumbai', 'Parbhani', 'Pune',
    'Ratnagiri', 'Sangli', 'Satara', 'Solapur', 'Thane', 'Wardha', 'Yavatmal',
  ],
  Manipur: ['Bishnupur', 'Churachandpur', 'Imphal', 'Kakching', 'Senapati', 'Thoubal', 'Ukhrul'],
  Meghalaya: ['Baghmara', 'Jowai', 'Nongstoin', 'Shillong', 'Tura', 'Williamnagar'],
  Mizoram: ['Aizawl', 'Champhai', 'Kolasib', 'Lunglei', 'Saiha', 'Serchhip'],
  Nagaland: ['Dimapur', 'Kohima', 'Mokokchung', 'Mon', 'Tuensang', 'Wokha', 'Zunheboto'],
  Odisha: [
    'Angul', 'Balangir', 'Balasore', 'Baripada', 'Berhampur', 'Bhadrak', 'Bhubaneswar', 'Cuttack', 'Dhenkanal',
    'Jeypore', 'Jharsuguda', 'Puri', 'Rayagada', 'Rourkela', 'Sambalpur',
  ],
  Punjab: [
    'Amritsar', 'Barnala', 'Batala', 'Bathinda', 'Fatehgarh Sahib', 'Firozpur', 'Hoshiarpur', 'Jalandhar',
    'Kapurthala', 'Ludhiana', 'Moga', 'Mohali', 'Pathankot', 'Patiala', 'Phagwara', 'Rupnagar', 'Sangrur',
  ],
  Rajasthan: [
    'Ajmer', 'Alwar', 'Banswara', 'Barmer', 'Beawar', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Chittorgarh',
    'Churu', 'Hanumangarh', 'Jaipur', 'Jhunjhunu', 'Jodhpur', 'Kota', 'Nagaur', 'Pali', 'Sikar',
    'Sri Ganganagar', 'Tonk', 'Udaipur',
  ],
  Sikkim: ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Rangpo', 'Singtam'],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Erode', 'Hosur', 'Kanchipuram', 'Karur', 'Kumbakonam',
    'Madurai', 'Nagapattinam', 'Nagercoil', 'Namakkal', 'Pollachi', 'Salem', 'Sivakasi', 'Thanjavur',
    'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tiruppur', 'Tiruvannamalai', 'Vellore',
  ],
  Telangana: [
    'Adilabad', 'Hyderabad', 'Jagtial', 'Karimnagar', 'Khammam', 'Kothagudem', 'Mahbubnagar', 'Mancherial',
    'Miryalaguda', 'Nalgonda', 'Nizamabad', 'Ramagundam', 'Secunderabad', 'Siddipet', 'Suryapet', 'Warangal',
  ],
  Tripura: ['Agartala', 'Ambassa', 'Belonia', 'Dharmanagar', 'Kailashahar', 'Udaipur'],
  'Uttar Pradesh': [
    'Agra', 'Aligarh', 'Amroha', 'Ayodhya', 'Azamgarh', 'Banda', 'Bareilly', 'Bulandshahr', 'Etawah',
    'Firozabad', 'Gorakhpur', 'Ghaziabad', 'Gonda', 'Hapur', 'Jaunpur', 'Jhansi', 'Kanpur', 'Lucknow',
    'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Noida', 'Prayagraj', 'Rampur',
    'Saharanpur', 'Shahjahanpur', 'Sitapur', 'Sultanpur', 'Varanasi',
  ],
  Uttarakhand: [
    'Almora', 'Dehradun', 'Haldwani', 'Haridwar', 'Kashipur', 'Kotdwar', 'Mussoorie', 'Nainital',
    'Pithoragarh', 'Rishikesh', 'Roorkee', 'Rudrapur',
  ],
  'West Bengal': [
    'Asansol', 'Baharampur', 'Balurghat', 'Bankura', 'Bardhaman', 'Cooch Behar', 'Darjeeling', 'Durgapur',
    'Habra', 'Haldia', 'Howrah', 'Jalpaiguri', 'Kharagpur', 'Kolkata', 'Krishnanagar', 'Malda', 'Medinipur',
    'Purulia', 'Raiganj', 'Siliguri',
  ],
  'Andaman and Nicobar Islands': ['Car Nicobar', 'Diglipur', 'Mayabunder', 'Port Blair', 'Rangat'],
  Chandigarh: ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  Delhi: [
    'Central Delhi', 'Dwarka', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi',
    'Rohini', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi',
  ],
  'Jammu and Kashmir': [
    'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Jammu', 'Kathua', 'Kupwara', 'Pulwama', 'Rajouri',
    'Sopore', 'Srinagar', 'Udhampur',
  ],
  Ladakh: ['Kargil', 'Leh'],
  Lakshadweep: ['Agatti', 'Amini', 'Andrott', 'Kavaratti', 'Minicoy'],
  Puducherry: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
}
