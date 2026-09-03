# CrisisConnect Testing Checklist

## 1. Authentication

- [ ] Login page loads correctly
- [ ] User can select role
- [ ] Valid login works
- [ ] Invalid login shows error
- [ ] Logout works
- [ ] User cannot access protected pages without login

## 2. Dashboard

- [ ] Dashboard loads correctly
- [ ] Emergency categories display
- [ ] SOS button is visible
- [ ] Emergency request count displays correctly
- [ ] Navigation works
- [ ] Mobile layout works
- [ ] Desktop layout works

## 3. Create Emergency Request

- [ ] Create Request page opens
- [ ] User can select emergency type
- [ ] User can select priority
- [ ] User can enter description
- [ ] Location can be selected
- [ ] Form validation works
- [ ] Request submits successfully
- [ ] Success message appears
- [ ] Request appears in the request list

## 4. Emergency Requests

- [ ] Request list loads
- [ ] Request cards display correctly
- [ ] Emergency type is displayed
- [ ] Priority is displayed
- [ ] Status is displayed
- [ ] Location is displayed
- [ ] Volunteer can accept a request
- [ ] Accepted request changes status
- [ ] Request updates in real time

## 5. Map

- [ ] Map loads correctly
- [ ] Emergency markers appear
- [ ] User location works
- [ ] Different emergency locations are visible
- [ ] Map works on mobile
- [ ] Map works on desktop

## 6. Request Tracking

- [ ] Request status is visible
- [ ] Volunteer assignment is displayed
- [ ] Status changes correctly
- [ ] Completed request shows completed status
- [ ] Real-time status updates work

## 7. Profile

- [ ] Profile page loads
- [ ] User name displays
- [ ] User role displays
- [ ] Verification status displays
- [ ] Request history displays
- [ ] Logout works

## 8. Responsiveness

- [ ] Tested on desktop
- [ ] Tested on tablet
- [ ] Tested on mobile
- [ ] No horizontal scrolling
- [ ] Buttons are easy to click
- [ ] Text is readable
- [ ] Images display correctly

## 9. Error Handling

- [ ] Invalid login shows an error
- [ ] Empty form shows validation
- [ ] Network/database error is handled
- [ ] Loading state is displayed
- [ ] Missing data doesn't crash the app

## 10. Final Testing

- [ ] No major console errors
- [ ] No broken links
- [ ] No broken images
- [ ] No blank screens
- [ ] `npm run build` succeeds
- [ ] Production application works
- [ ] Deployed application works