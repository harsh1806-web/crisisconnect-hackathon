# CrisisConnect Testing Checklist

## 1. Authentication

| Test | Expected Result | Status |
|---|---|---|
| User login | User successfully logs in | ⬜ |
| Authority login | Authority successfully logs in | ⬜ |
| Invalid login | Error message displayed | ⬜ |
| Logout | User is logged out and redirected | ⬜ |

---

## 2. Emergency Reporting

| Test | Expected Result | Status |
|---|---|---|
| Empty description | Validation error displayed | ⬜ |
| Valid emergency | Emergency successfully created | ⬜ |
| Location access | User location is captured | ⬜ |
| AI analysis | Emergency is analyzed successfully | ⬜ |
| Priority assignment | Priority is assigned correctly | ⬜ |
| Authority assignment | Appropriate authority is assigned | ⬜ |
| Unique token | Unique tracking token is generated | ⬜ |

---

## 3. Emergency Tracking

| Test | Expected Result | Status |
|---|---|---|
| Valid token | Correct emergency is displayed | ⬜ |
| Invalid token | Error / not-found message displayed | ⬜ |
| Status update | Latest status is displayed | ⬜ |
| Timeline | Emergency timeline is displayed correctly | ⬜ |

---

## 4. Authority Dashboard

| Test | Expected Result | Status |
|---|---|---|
| View emergencies | Assigned emergencies are displayed | ⬜ |
| Verify request | Request can be verified | ⬜ |
| Assign team | Team can be assigned | ⬜ |
| Update status | Emergency status changes | ⬜ |
| Resolve request | Emergency can be marked resolved | ⬜ |

---

## 5. Volunteer

| Test | Expected Result | Status |
|---|---|---|
| Registration | Volunteer can register | ⬜ |
| Skills | Volunteer skills can be added | ⬜ |
| Availability | Availability can be updated | ⬜ |

---

## 6. Donation

| Test | Expected Result | Status |
|---|---|---|
| Create pledge | Donation pledge is created | ⬜ |
| Required fields | Missing fields show validation | ⬜ |

---

## 7. Nearby Help

| Test | Expected Result | Status |
|---|---|---|
| Location permission | Location permission works | ⬜ |
| Service categories | Categories are displayed | ⬜ |
| Map loading | Map loads successfully | ⬜ |

---

## 8. Frontend

### Responsive Design

- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] No horizontal scrolling
- [ ] Buttons are usable on mobile
- [ ] Text remains readable

### Navigation

- [ ] All navigation links work
- [ ] Back navigation works
- [ ] Protected routes are protected
- [ ] Invalid routes show an appropriate page

### UI States

- [ ] Loading states are displayed
- [ ] Error states are displayed
- [ ] Empty states are handled
- [ ] Success messages are displayed

---

## 9. API Testing

- [ ] Backend starts successfully
- [ ] API endpoints respond correctly
- [ ] Invalid requests return appropriate errors
- [ ] CORS works with production frontend
- [ ] Production API URL works
- [ ] Firebase authentication works with production API

---

## 10. Final Test

- [ ] No critical bugs
- [ ] No major console errors
- [ ] Production build succeeds
- [ ] Production frontend works
- [ ] Production backend works
- [ ] Firebase works in production