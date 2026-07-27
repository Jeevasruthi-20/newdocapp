import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FiHeart, FiShield, FiUsers, FiClock, FiAward, FiCheckCircle, FiUserCheck, FiStar, FiActivity
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const TEAM = [
  { name: 'Dr. Priya Sharma', role: 'Chief Medical Officer', spec: 'Cardiology', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop' },
  { name: 'Dr. Rajesh Kumar', role: 'Head of Telemedicine', spec: 'Internal Medicine', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop' },
  { name: 'Dr. Meera Iyer', role: 'Women\'s Health Lead', spec: 'Gynecology', img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=500&fit=crop' },
  { name: 'Dr. Karthik Menon', role: 'Pediatrics Director', spec: 'Pediatrics', img: 'https://images.unsplash.com/photo-1537368910025-702850352726?w=400&h=500&fit=crop' },
];

const About = () => {
  const { t } = useTranslation();

  const STATS = [
    { value: '50K+', label: t('about.patientsServed'), icon: FiUsers },
    { value: '200+', label: t('about.expertDoctors'), icon: FiUserCheck },
    { value: '24/7', label: t('about.careAvailable'), icon: FiClock },
    { value: '98%', label: t('about.satisfactionRate'), icon: FiStar },
  ];

  const TIMELINE = [
    { year: '2019', title: t('about.timeline.2019'), desc: t('about.timeline.2019Desc') },
    { year: '2021', title: t('about.timeline.2021'), desc: t('about.timeline.2021Desc') },
    { year: '2023', title: t('about.timeline.2023'), desc: t('about.timeline.2023Desc') },
    { year: '2025', title: t('about.timeline.2025'), desc: t('about.timeline.2025Desc') },
  ];

  const WHY = [
    { icon: FiShield, title: 'Bank-Grade Security', desc: t('about.why.d1') },
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
      <section className="relative overflow-hidden bg-medical-gradient text-white py-20 sm:py-28"
               style={{
                 backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 2px, transparent 2px), linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0069c0 100%)',
                 backgroundSize: '30px 30px, auto'
               }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-medical-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <motion.span variants={fadeUp} className="inline-block px-4 py-1 rounded-full bg-white/20 text-sm font-medium mb-6">About MedConnect</motion.span>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-bold mb-4 leading-tight text-white">{t('about.heroTitle')}</motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-white/90 max-w-2xl mx-auto mb-8">{t('about.heroSubtitle')}</motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/signup"><Button className="!bg-white !text-medical-600 hover:shadow-lg transition-shadow">{t('about.getStarted')}</Button></Link>
              <Link to="/doctors"><Button variant="secondary" className="!border-white/50 !text-white hover:!bg-white/10 hover:shadow-lg transition-shadow">{t('about.findDoctor')}</Button></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Animated stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp}>
              <Card className="text-center !p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <s.icon className="text-2xl text-medical-400 mx-auto mb-2 opacity-80" />
                <motion.p
                  className="text-3xl font-bold text-medical-600"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                >
                  {s.value}
                </motion.p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        <motion.div {...fadeUp}>
          <Card className="h-full border-l-4 border-l-medical-500 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-medical-50 flex items-center justify-center mb-5">
              <FiHeart className="text-2xl text-medical-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('about.mission')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('about.missionText') || "To make quality healthcare accessible, affordable, and personal for every patient through technology-driven telemedicine and compassionate care."}
            </p>
          </Card>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="h-full border-l-4 border-l-sky-400 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-5">
              <FiCheckCircle className="text-2xl text-sky-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">{t('about.vision')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('about.visionText') || "A world where every person — regardless of location or language — can connect with trusted physicians instantly and manage their health with confidence."}
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
                <Card className={`text-center h-full hover:-translate-y-2 hover:shadow-xl transition-all duration-300 ${i % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}`}>
                  <div className="w-16 h-16 rounded-full bg-medical-50 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="text-2xl text-medical-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
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
              <Card className="text-center overflow-hidden !p-0 group cursor-pointer hover:shadow-xl transition-all duration-300">
                <div className="overflow-hidden aspect-[4/5] bg-slate-100">
                  <img src={doc.img} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 relative">
                  <h3 className="font-bold text-slate-800 text-lg">{doc.name}</h3>
                  <p className="text-sm text-medical-600 font-medium mb-1 relative inline-block">
                    {doc.role}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-medical-400 transition-all duration-300 group-hover:w-full"></span>
                  </p>
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
          <div className="relative border-l-2 border-medical-200 ml-4 md:ml-6 space-y-10 py-4">
            {TIMELINE.map((item, i) => (
              <motion.div key={item.year} {...fadeUp} transition={{ delay: 0.1 }} className="relative pl-10">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-medical-500 border-4 border-white shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
                <span className="inline-block px-3 py-1 rounded bg-medical-100 text-sm font-bold text-medical-700 mb-2">{item.year}</span>
                <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
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
              <Card className="h-full hover:shadow-lg transition-shadow">
                <div className="text-medical-200 text-4xl mb-4 font-serif">"</div>
                <p className="text-slate-600 italic mb-6 leading-relaxed">&ldquo;{t_.quote}&rdquo;</p>
                <div className="border-t border-slate-100 pt-4 mt-auto">
                  <p className="font-semibold text-slate-800">{t_.name}</p>
                  <p className="text-xs text-slate-500">{t_.location}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <Card className="bg-medical-gradient !text-white !border-0 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          <div className="relative z-10 py-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t('about.ready') || "Ready to experience better healthcare?"}</h2>
            <p className="text-medical-100 mb-8 text-lg">{t('about.ctaText') || "Join thousands of patients who trust MedConnect."}</p>
            <Link to="/signup">
              <Button className="!bg-white !text-medical-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-8 py-3 text-lg">
                {t('about.createAccount') || "Create Free Account"}
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default About;
