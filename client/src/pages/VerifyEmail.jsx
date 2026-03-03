import React, {useEffect, useState} from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Loader, Check} from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'


const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status,setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(()=>{
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing. Please use the link from your email.');
                return;
            }

            try {
                const response = await axios.get('http://localhost:3000/api/auth/verify-email', {
                    params: {token}
                });

                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                toast.success('Account activated! You can now log in.');

                setTimeout(()=>{
                    navigate('/login')
                }, 3000);

            } catch (error) {
                setStatus('error');
                const errorMsg = error.response?.data?.error || 'Email verification failed. The link may have expired.';
                setMessage(errorMsg);
                toast.error(errorMsg);
            }


        };

        verifyEmail();
    }, [searchParams, navigate]);

  return (
    <div className='flex min-h-screen overflow-hidden bg-slate-900'>
        <AuthLeftPanel/>
        <div className='flex-1 bg-white flex items-center justify-center px-8 py-10 relative overflow-y-auto'>
            <div className='absolute top-0 right-0 w-125 h-125 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none'/>
            <div className='absolute bottom-0 left-0 w-100 h-100 rounded-full bg-indigo-400/5 blur-[80px] pointer-events-none'/>

            <div className='w-full max-w-130 bg-white/90 backdrop-blur-sm rounded-[28px] p-10 shadow-[0_32px_80px_rgba(11,36,71,0.10),0_4px_24px_rgba(11,36,71,0.06)] border border-white relative z-10'>
                <div className='flex flex-col items-center justify-center gap-6'>
                    {status === 'loading' && (
                        <>
                            <Loader className='w-16 h-16 text-indigo-500 animate-spin'/>
                            <div className='text-center'>
                                <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 mb-2'>
                                    Verifying Email
                                </h2>
                                <p className='text-[14px] text-slate-500 font-light'>
                                    Please wait while we verify your email address...
                                </p>
                            </div>
                        
                        </>
                    )}

                    {
                        status === 'success' && (
                            <>
                                <CheckCircle className='w-16 h-16 text-green-500'/>
                                <div className='text-center'>
                                    <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 mb-2'>
                                        Email Verified!
                                    </h2>

                                    <p className='text-[14px] text-slate-600 font-light mb-6'>
                                        {message}
                                    </p>

                                    <p className='text-[12px] text-slate-500 mb-8'>
                                        Redirecting to login in 3 seconds...
                                    </p>

                                    <Link to='/login'>
                                        <Button className='w-full h-12 bg-linear-to-r from-[#19376D] to-indigo-500 hover:shadow-lg font-[Outfit] text-[14px] font-600 cursor-pointer'>
                                            Go to Login
                                        </Button>       
                                    </Link>
                                </div>
                            </>
                        )}


                    {status === 'error' && (
                        <>
                            <AlertCircle className='w-16 h-16 text-red-500'/>
                            <div className='text-center'>
                                <h2 className='font-[Outfit] text-[28px] font-700 text-slate-900 mb-2'>
                                    Verification Failed
                                </h2>
                                <p className='text-[14px] text-slate-600 font-light mb-6'>
                                    {message}
                                </p>
                                <div className='flex gap-3 flex-col'>
                                    <Link to='/'>
                                        <Button className='w-full h-12 bg-linear-to-r from-[#19376D] to-indigo-500 hover:shadow-lg font-[Outfit] text-[14px] font-600 cursor-pointer'>
                                            Try Again
                                        </Button>
                                    </Link>
                                    <Link to='/login'>
                                        <Button variant='outline' className='w-full h-12 font-[Outfit] text-[14px] font-600 cursor-pointer'>
                                            Go to Login
                                        </Button>
                                    
                                    </Link>
                                </div>
                            </div>           
                        </>
                    )
                    }
                </div>
            </div>
        </div>
    </div>
  )
}

export default VerifyEmail

