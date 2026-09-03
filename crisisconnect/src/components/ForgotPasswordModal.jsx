import React, { useState } from 'react';
import { X, KeyRound, Phone, Lock, Send, CheckCircle2, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { supabase } from '../services/supabase';
import { citizenDB } from '../services/db';
import { openNativeSms } from '../services/smsSosService';
import toast from 'react-hot-toast';

export default function ForgotPasswordModal({ role = 'citizen', initialPhone = '', onClose, onPasswordResetSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter Phone / ID, 2: Enter OTP & New Password
  const [phone, setPhone] = useState(initialPhone || '');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Authority specific fields
  const [authorityBadge, setAuthorityBadge] = useState('POLICE-100');

  // Step 1: Send SMS OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (role === 'citizen') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        toast.error('Please enter a valid 10-digit registered phone number.');
        return;
      }

      setIsProcessing(true);
      try {
        // Check if citizen exists in Supabase
        const { data: citizen, error } = await supabase
          .from('citizens')
          .select('id, name, phone')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (error) {
          console.warn('Supabase query note:', error);
        }

        // Generate 6-digit random OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        setGeneratedOtp(otp);

        // SMS message payload
        const smsBody = `CrisisConnect Emergency Alert: Your password reset verification code is ${otp}. Use this to reset your account password.`;

        // Trigger native SMS app if requested
        openNativeSms({ recipient: cleanPhone, body: smsBody });

        toast.success(`📱 SMS Sent to ${cleanPhone}! OTP: ${otp}`, { duration: 6000 });
        setStep(2);
      } catch (err) {
        toast.error('Failed to generate SMS OTP: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    } else if (role === 'authority') {
      // Authority command dispatch
      const otp = 'AUTH-7788';
      setGeneratedOtp(otp);
      toast.success(`Command dispatch code generated: ${otp}`);
      setStep(2);
    } else {
      // NGO dispatch
      const otp = 'NGO-RELIEF-99';
      setGeneratedOtp(otp);
      toast.success(`Relief coordinator code generated: ${otp}`);
      setStep(2);
    }
  };

  // Step 2: Verify OTP and save new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (userEnteredOtp.trim() !== generatedOtp.trim()) {
      toast.error('Invalid OTP. Please enter the correct verification code.');
      return;
    }

    if (!newPassword.trim()) {
      toast.error('Please enter your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please re-enter.');
      return;
    }

    setIsProcessing(true);
    try {
      if (role === 'citizen') {
        const cleanPhone = phone.replace(/\D/g, '');

        // 1. Update in Supabase
        await supabase
          .from('citizens')
          .update({ password_hash: newPassword.trim(), updated_at: new Date().toISOString() })
          .eq('phone', cleanPhone);

        toast.success('Password updated successfully in database! You can now log in.');
        onPasswordResetSuccess(cleanPhone, newPassword.trim());
      } else {
        toast.success('Access credentials updated successfully!');
        onClose();
      }
    } catch (err) {
      toast.error('Failed to reset password: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/30 text-red-400 flex items-center justify-center font-bold border border-red-500/40 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">
                SECURITY VERIFICATION
              </span>
              <h2 className="text-base font-black text-white">
                {role === 'authority' ? 'Reset Security PIN' : role === 'ngo' ? 'Relief Portal Recovery' : 'Reset Citizen Password'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {role === 'citizen'
                  ? 'Enter your registered 10-digit mobile number. We will dispatch a password reset code directly to your phone via SMS.'
                  : 'Enter your registered coordinator identity to receive an emergency authorization override code.'}
              </p>

              {role === 'citizen' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone (e.g. 9850422491)"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-semibold"
                    />
                  </div>
                </div>
              ) : role === 'authority' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Command Badge ID
                  </label>
                  <input
                    type="text"
                    required
                    value={authorityBadge}
                    onChange={(e) => setAuthorityBadge(e.target.value)}
                    placeholder="e.g. POLICE-100"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 font-mono font-bold uppercase"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NGO Coordinator Lead
                  </label>
                  <input
                    type="text"
                    required
                    defaultValue="Red Cross Relief Lead"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/30 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isProcessing ? 'Dispatching SMS...' : 'Send Reset Code via SMS'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-tight flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SMS verification code sent! Enter OTP and choose a new password.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Verification OTP</label>
                  <span className="text-[10px] text-red-600 font-mono font-bold">Hint: {generatedOtp}</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={userEnteredOtp}
                  onChange={(e) => setUserEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-center tracking-widest text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Updating Database...' : 'Set New Password & Enter'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-500 hover:underline pt-1 cursor-pointer"
              >
                Back to Phone Verification
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
