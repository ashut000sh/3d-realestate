-- Count wrong guesses per OTP code, so a code can't be guessed by trying all 1,000,000 numbers.
-- After MAX_OTP_ATTEMPTS wrong tries (auth.service.js) the code is used up and a new one is needed.
ALTER TABLE otp_codes ADD COLUMN attempts INT NOT NULL DEFAULT 0;
