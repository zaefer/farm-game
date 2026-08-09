"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import Link from "next/link";


type BanExpiryStatusProps = {
  expiresAt: string | null;
  children: ReactNode;
};


export default function BanExpiryStatus({
  expiresAt,
  children,
}: BanExpiryStatusProps) {
  const [
    now,
    setNow,
  ] = useState<number | null>(
    null
  );


  // =====================================================
  // CLOCK
  // =====================================================

  useEffect(() => {
    const updateTime = () => {
      setNow(
        Date.now()
      );
    };


    const firstTimer =
      window.setTimeout(
        updateTime,
        0
      );


    const interval =
      window.setInterval(
        updateTime,
        1000
      );


    return () => {
      window.clearTimeout(
        firstTimer
      );

      window.clearInterval(
        interval
      );
    };
  }, []);


  // =====================================================
  // PERMANENT BAN
  // =====================================================

  if (!expiresAt) {
    return children;
  }


  // İlk client zamanı henüz oluşmadıysa
  // mevcut ban ekranını göstermeye devam et.
  if (now === null) {
    return children;
  }


  const expiresAtTime =
    new Date(
      expiresAt
    ).getTime();


  const hasExpired =
    now >= expiresAtTime;


  // =====================================================
  // STILL BANNED
  // =====================================================

  if (!hasExpired) {
    return children;
  }


  // =====================================================
  // BAN EXPIRED
  // =====================================================

  return (
    <div className="text-center">

      <div className="text-5xl">
        ✅
      </div>


      <h1 className="mt-5 text-3xl font-bold">
        Ban Expired
      </h1>


      <p className="mt-3 text-white/50">
        Your suspension period has ended.
        You can login again.
      </p>


      <Link
        href="/login"
        className="mt-7 inline-block rounded-xl bg-green-500 px-6 py-3 font-semibold text-black transition hover:bg-green-400"
      >
        Return to Login
      </Link>

    </div>
  );
}