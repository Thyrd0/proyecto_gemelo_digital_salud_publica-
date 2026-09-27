import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AcademicDisclaimer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3.5 flex items-start gap-3 text-amber-200 text-xs sm:text-sm shadow-sm backdrop-blur-sm">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold text-amber-300 mr-1">
          [{t('academicTag')}]:
        </span>
        {t('academicDisclaimer')}
      </div>
    </div>
  );
};
