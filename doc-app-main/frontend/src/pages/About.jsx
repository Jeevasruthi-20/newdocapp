import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiHeart, FiShield, FiUsers, FiClock, FiAward, FiCheckCircle,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const TEAM = [
  { name: 'Dr. Priya Sharma', role: 'Chief Medical Officer', spec: 'Cardiology', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop' },
  { name: 'Dr. Rajesh Kumar', role: 'Head of Telemedicine', spec: 'Internal Medicine', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop' },
  { name: 'Dr. Meera Iyer', role: 'Women\'s Health Lead', spec: 'Gynecology', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop' },
  { name: 'Dr. Karthik Menon', role: 'Pediatrics Director', spec: 'Pediatrics', img: 'https://images.unsplash.com/photo-1622253692010-333f45794416?w=200&h=200&fit=crop' },
];

const About = () => {
  const { t } = useTranslation();

  const STATS = [
    { value: '50K+', label: t('about.patientsServed') },
    { value: '200+', label: t('about.expertDoctors') },
    { value: '24/7', label: t('about.careAvailable') },
    { value: '98%', label: t('about.satisfactionRate') },
  ];

  const TIMELINE = [
    { year: '2019', title: t('about.timeline.2019'), desc: t('about.timeline.2019Desc') },
    { year: '2021', title: t('about.timeline.2021'), desc: t('about.timeline.2021Desc') },
    { year: '2023', title: t('about.timeline.2023'), desc: t('about.timeline.2023Desc') },
    { year: '2025', title: t('about.timeline.2025'), desc: t('about.timeline.2025Desc') },
  ];

  const WHY = [
    { icon: FiShield, title: t('about.why.t1'), desc: t('about.why.d1') },
    { icon: FiClock, title: t('about.why.t2'), desc: t('about.why.d2') },
    { icon: FiUsers, title: t('about.why.t3'), desc: t('about.why.d3') },
    { icon: FiAward, title: t('about.why.t4'), desc: t('about.why.d4') },
  ];

  const TESTIMONIALS = [
    { quote: t('about.patientStories.q1'), name: 'Anitha R.', location: 'Chennai' },
    { quote: t('about.patientStories.q2'), name: 'Mohammed K.', location: 'Hyderabad' },
    { quote: t('about.patientStories.q3'), name: 'Lakshmi P.', location: 'Coimbatore' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 via-white to-medical-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-medical-gradient text-white py-20 sm:py-28">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-medical-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1 rounded-full bg-white/20 text-sm font-medium mb-6">About MedConnect</span>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">{t('about.heroTitle')}</h1>
            <p className="text-lg text-medical-100 max-w-2xl mx-auto mb-8">{t('about.heroSubtitle')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup"><Button className="!bg-white !text-medical-600">{t('about.getStarted')}</Button></Link>
              <Link to="/doctors"><Button variant="secondary" className="!border-white/50 !text-white hover:!bg-white/10">{t('about.findDoctor')}</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Animated stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="text-center !p-6">
                <motion.p
                  className="text-3xl font-bold text-medical-600"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                >
                  {s.value}
                </motion.p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        <motion.div {...fadeUp}>
          <Card className="h-full border-l-4 border-l-medical-500">
            <FiHeart className="text-3xl text-medical-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('about.mission')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('about.missionText')}
            </p>
          </Card>
        </motion.div>
        <motion.div {...fadeUp}>
          <Card className="h-full border-l-4 border-l-sky-400">
            <FiCheckCircle className="text-3xl text-sky-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('about.vision')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('about.visionText')}
            </p>
          </Card>
        </motion.div>
      </section>

      {/* Why choose */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="text-2xl font-bold text-center text-slate-800 mb-10">{t('about.whyChoose')}</motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map((item, i) => (
              <motion.div key={item.title} {...fadeUp} transition={{ delay: i * 0.08 }}>
                <Card className="text-center h-full">
                  <item.icon className="text-3xl text-medical-500 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.h2 {...fadeUp} className="text-2xl font-bold text-center text-slate-800 mb-10">{t('about.team')}</motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((doc, i) => (
            <motion.div key={doc.name} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="text-center overflow-hidden !p-0">
                <img src={doc.img} alt={doc.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-slate-800">{doc.name}</h3>
                  <p className="text-sm text-medical-600">{doc.role}</p>
                  <p className="text-xs text-slate-400 mt-1">{doc.spec}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-medical-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.h2 {...fadeUp} className="text-2xl font-bold text-center text-slate-800 mb-10">{t('about.history')}</motion.h2>
          <div className="relative border-l-2 border-medical-200 ml-4 space-y-8">
            {TIMELINE.map((item, i) => (
              <motion.div key={item.year} {...fadeUp} transition={{ delay: i * 0.1 }} className="relative pl-8">
                <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-medical-500 border-4 border-white shadow-medical" />
                <span className="text-sm font-bold text-medical-600">{item.year}</span>
                <h3 className="font-bold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.h2 {...fadeUp} className="text-2xl font-bold text-center text-slate-800 mb-10">{t('about.testimonials')}</motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t_, i) => (
            <motion.div key={t_.name} {...fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="h-full">
                <p className="text-slate-600 italic mb-4">&ldquo;{t_.quote}&rdquo;</p>
                <p className="font-semibold text-slate-800">{t_.name}</p>
                <p className="text-xs text-slate-400">{t_.location}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <Card className="bg-medical-gradient !text-white !border-0">
          <h2 className="text-2xl font-bold mb-3">{t('about.ready')}</h2>
          <p className="text-medical-100 mb-6">{t('about.ctaText')}</p>
          <Link to="/signup"><Button className="!bg-white !text-medical-600">{t('about.createAccount')}</Button></Link>
        </Card>
      </section>
    </div>
  );
};

export default About;
