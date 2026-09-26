"""Seed a much larger demo dataset: full subject list, multiple classes,
several teachers, many students, and a spread of assignments per class/subject.

Only uses models/fields already proven in the original seed_demo.py
(accounts, schools, assignments, payments, notifications) — nothing here
assumes a submissions/attempts app, since that model wasn't shown to me.
See the bottom of this file for exactly what's still missing for "progress" data.
"""
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal

from accounts.models import Profile, SchoolMembership
from schools.models import (
    School,
    AcademicYear,
    Subject,
    ClassGroup,
    ClassEnrollment,
    TeacherAssignment,
)
from assignments.models import Assignment, AssignmentTarget
from payments.models import TopUpCode
from notifications.models import Notification

User = get_user_model()

random.seed(42)  # reproducible demo data across runs

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------

SUBJECTS = [
    ("math", "Matematika"),
    ("uzbek", "Ona tili va adabiyot"),
    ("physics", "Fizika"),
    ("chemistry", "Kimyo"),
    ("history", "Tarix"),
    ("informatics", "Informatika"),
    ("english", "Ingliz tili"),
    ("russian", "Rus tili"),
    ("biology", "Biologiya"),
    ("geography", "Geografiya"),
    ("law", "Huquq"),
]

# (class name, grade, subject codes taught in that class)
CLASSES = [
    ("5-A", 5, ["math", "uzbek", "english", "russian", "informatics"]),
    ("6-B", 6, ["math", "uzbek", "english", "russian", "informatics", "biology", "geography"]),
    ("7-A", 7, ["math", "uzbek", "physics", "english", "russian", "informatics", "biology", "geography"]),
    ("9-A", 9, ["math", "uzbek", "physics", "chemistry", "history", "informatics",
                "english", "russian", "biology", "geography", "law"]),
    ("11-A", 11, ["math", "uzbek", "physics", "chemistry", "history", "informatics",
                  "english", "russian", "biology", "geography", "law"]),
]

# Teachers, each covering a handful of subjects (subject code -> teacher username)
TEACHERS = [
    ("teacher_math", "Olimjon Qodirov", ["math"]),
    ("teacher_uzbek", "Gulnora Yusupova", ["uzbek", "history"]),
    ("teacher_science", "Sardor Aliyev", ["physics", "chemistry"]),
    ("teacher_lang", "Nilufar Ergasheva", ["english", "russian"]),
    ("teacher_it", "Bekzod Nematov", ["informatics", "law"]),
    ("teacher_nature", "Feruza Islomova", ["biology", "geography"]),
]

STUDENT_FIRST_NAMES = [
    "Aziz", "Dilnoza", "Jasur", "Madina", "Sherzod", "Malika", "Otabek", "Zarina",
    "Diyor", "Nodira", "Sanjar", "Gulbahor", "Farrux", "Shahnoza", "Bekzod",
    "Ozoda", "Ulug'bek", "Kamola", "Islom", "Mehriniso",
]
STUDENT_LAST_NAMES = [
    "Karimov", "Saidova", "Toshmatov", "Yusupova", "Rashidov", "Ismoilova",
    "Nazarov", "Qodirova", "Ergashev", "Mirzayeva",
]

NOTIFICATION_TEMPLATES = [
    ("Yangi vazifa", "Sizga yangi uy vazifasi berildi. Muddatini unutmang!"),
    ("Natija tayyor", "Oxirgi testingiz natijasi tekshirildi — tafsilotlarni ko'ring."),
    ("Eslatma", "Ertaga topshirilishi kerak bo'lgan vazifangiz bor."),
    ("Xush kelibsiz", "Mirae Maktab demo bildirishnomasi."),
]

SAMPLE_QUESTIONS = {
    "math": [
        {"text": "2 + 2 = ?", "options": ["3", "4", "5", "6"], "correct": 1, "points": 1},
        {"text": "Pifagor teoremasi qaysi uchburchakka tegishli?",
         "options": ["O'tkir", "To'g'ri", "G'ayri", "Teng tomonli"], "correct": 1, "points": 1},
        {"text": "12 ning 25% i nechaga teng?", "options": ["2", "3", "4", "6"], "correct": 1, "points": 1},
    ],
    "physics": [
        {"text": "π taxminan nechaga teng?", "options": ["2.14", "3.14", "4.14", "1.41"], "correct": 1, "points": 1},
        {"text": "Yorug'lik tezligi vakuumda taxminan qancha (km/s)?",
         "options": ["150 000", "300 000", "3 000", "1 000 000"], "correct": 1, "points": 1},
    ],
    "chemistry": [
        {"text": "Suvning kimyoviy formulasi qanday?", "options": ["CO2", "H2O", "O2", "NaCl"], "correct": 1, "points": 1},
    ],
    "uzbek": [
        {"text": "'Kitob' so'zining ko'plik shakli qanday?", "options": ["Kitoblar", "Kitobcha", "Kitobiy", "Kitobli"],
         "correct": 0, "points": 1},
    ],
    "history": [
        {"text": "Amir Temur qaysi asrda yashagan?", "options": ["XII", "XIV", "XVI", "XVIII"], "correct": 1, "points": 1},
    ],
    "informatics": [
        {"text": "1 bayt necha bitdan iborat?", "options": ["4", "8", "16", "32"], "correct": 1, "points": 1},
    ],
    "english": [
        {"text": "Choose the correct form: She ___ to school every day.",
         "options": ["go", "goes", "going", "gone"], "correct": 1, "points": 1},
    ],
    "russian": [
        {"text": "Как переводится слово 'книга'?", "options": ["kitob", "daftar", "qalam", "stol"],
         "correct": 0, "points": 1},
    ],
    "biology": [
        {"text": "Inson yurak kamerasi nechta?", "options": ["2", "3", "4", "5"], "correct": 2, "points": 1},
    ],
    "geography": [
        {"text": "O'zbekistonning poytaxti qaysi shahar?",
         "options": ["Samarqand", "Buxoro", "Toshkent", "Andijon"], "correct": 2, "points": 1},
    ],
    "law": [
        {"text": "O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?",
         "options": ["1991", "1992", "1994", "1996"], "correct": 1, "points": 1},
    ],
}


class Command(BaseCommand):
    help = "Seed a large demo dataset for Mirae Maktab backend (11 subjects, 5 classes, 6 teachers, ~100 students)"

    def handle(self, *args, **options):
        school, _ = School.objects.get_or_create(
            code="mirae-demo",
            defaults={"name": "Mirae Demo Maktab", "timezone": "Asia/Tashkent"},
        )
        year, _ = AcademicYear.objects.get_or_create(
            school=school,
            label="2025-2026",
            defaults={
                "starts_on": date(2025, 9, 1),
                "ends_on": date(2026, 6, 15),
                "is_current": True,
            },
        )

        # ------------------------------------------------------------------
        # Subjects — full fixed list of 11
        # ------------------------------------------------------------------
        subject_by_code = {}
        for code, name in SUBJECTS:
            s, _ = Subject.objects.get_or_create(
                school=school, code=code, defaults={"name": name}
            )
            subject_by_code[code] = s
        self.stdout.write(self.style.SUCCESS(f"Subjects: {len(subject_by_code)}"))

        # ------------------------------------------------------------------
        # Super admin + school admin (kept from original seed)
        # ------------------------------------------------------------------
        sa, created = User.objects.get_or_create(
            username="superadmin",
            defaults={"global_role": "superadmin", "is_staff": True, "is_superuser": True},
        )
        if created:
            sa.set_password("mirae123")
            sa.save()
        Profile.objects.get_or_create(user=sa, defaults={"full_name": "Super Admin"})

        admin, created = User.objects.get_or_create(
            username="admin", defaults={"global_role": "admin", "is_staff": True},
        )
        if created:
            admin.set_password("mirae123")
            admin.save()
        Profile.objects.get_or_create(user=admin, defaults={"full_name": "Maktab Admin"})
        SchoolMembership.objects.get_or_create(
            user=admin, school=school, academic_year=year, role="admin",
            defaults={"is_active": True},
        )

        # ------------------------------------------------------------------
        # Teachers — 6 teachers covering all 11 subjects between them
        # ------------------------------------------------------------------
        teacher_by_username = {}
        for username, full_name, _codes in TEACHERS:
            t, created = User.objects.get_or_create(
                username=username, defaults={"global_role": "teacher"},
            )
            if created:
                t.set_password("mirae123")
                t.save()
            Profile.objects.get_or_create(user=t, defaults={"full_name": full_name})
            SchoolMembership.objects.get_or_create(
                user=t, school=school, academic_year=year, role="teacher",
                defaults={"is_active": True},
            )
            teacher_by_username[username] = t
        self.stdout.write(self.style.SUCCESS(f"Teachers: {len(teacher_by_username)}"))

        def teacher_for_subject(code):
            for username, _name, codes in TEACHERS:
                if code in codes:
                    return teacher_by_username[username]
            return teacher_by_username["teacher_math"]  # fallback

        # ------------------------------------------------------------------
        # Classes + students + enrollments + teacher assignments
        # ------------------------------------------------------------------
        student_counter = 0
        all_students = []
        class_groups = {}

        for class_name, grade, subject_codes in CLASSES:
            cg, _ = ClassGroup.objects.get_or_create(
                school=school, academic_year=year, name=class_name,
                defaults={"grade": grade},
            )
            class_groups[class_name] = cg

            # Teacher assignments: one teacher per subject taught in this class
            for code in subject_codes:
                TeacherAssignment.objects.get_or_create(
                    teacher=teacher_for_subject(code),
                    class_group=cg,
                    subject=subject_by_code[code],
                    academic_year=year,
                    defaults={"is_active": True},
                )

            # ~20 students per class
            class_students = []
            for _ in range(20):
                student_counter += 1
                username = f"student{student_counter}"
                full_name = f"{random.choice(STUDENT_FIRST_NAMES)} {random.choice(STUDENT_LAST_NAMES)}"
                u, created = User.objects.get_or_create(
                    username=username, defaults={"global_role": "student"},
                )
                if created:
                    u.set_password("mirae123")
                    u.save()
                Profile.objects.get_or_create(user=u, defaults={"full_name": full_name})
                SchoolMembership.objects.get_or_create(
                    user=u, school=school, academic_year=year, role="student",
                    defaults={"is_active": True},
                )
                ClassEnrollment.objects.get_or_create(
                    student=u, academic_year=year,
                    defaults={
                        "class_group": cg,
                        "pupil_code": f"{student_counter:06d}",
                        "is_active": True,
                    },
                )
                class_students.append(u)
                all_students.append(u)

            self.stdout.write(
                self.style.SUCCESS(f"Class {class_name}: {len(class_students)} students, "
                                    f"{len(subject_codes)} subjects")
            )

        # ------------------------------------------------------------------
        # Assignments — a spread of test-kind homework per class/subject,
        # across the last few weeks, mixing published/draft status
        # ------------------------------------------------------------------
        today = date.today()
        assignment_count = 0
        for class_name, _grade, subject_codes in CLASSES:
            cg = class_groups[class_name]
            for code in subject_codes:
                subject = subject_by_code[code]
                teacher = teacher_for_subject(code)
                questions = SAMPLE_QUESTIONS.get(code, SAMPLE_QUESTIONS["math"])

                # 3 assignments per class/subject: last week (done), this week
                # (published, open), next week (draft, not yet published)
                for offset, status in [(-7, "published"), (0, "published"), (7, "draft")]:
                    lesson_date = today + timedelta(days=offset)
                    title = f"{subject.name} — {class_name} nazorat ishi ({lesson_date.isoformat()})"
                    snapshot = [
                        {"id": i + 1, "version": 1, **q} for i, q in enumerate(questions)
                    ]
                    asg, created = Assignment.objects.get_or_create(
                        school=school, title=title,
                        defaults={
                            "subject": subject,
                            "created_by": teacher,
                            "kind": "test",
                            "status": status,
                            "lesson_date": lesson_date,
                            "deadline": timezone.now() + timedelta(days=offset + 7),
                            "question_snapshot": snapshot,
                            "max_score": sum(q["points"] for q in questions),
                            "published_at": timezone.now() if status == "published" else None,
                        },
                    )
                    AssignmentTarget.objects.get_or_create(assignment=asg, class_group=cg)
                    assignment_count += 1

        self.stdout.write(self.style.SUCCESS(f"Assignments created/verified: {assignment_count}"))

        # ------------------------------------------------------------------
        # Demo phones (kept + extended to every seeded user)
        # ------------------------------------------------------------------
        phone_base = 998900000000
        fixed_phone_map = {
            "superadmin": "+998901000001",
            "admin": "+998901000002",
        }
        for uname, ph in fixed_phone_map.items():
            User.objects.filter(username=uname).update(phone=ph)

        counter = 3
        for username in list(teacher_by_username.keys()):
            User.objects.filter(username=username).update(phone=f"+998901{counter:06d}")
            counter += 1
        for u in all_students:
            User.objects.filter(username=u.username).update(phone=f"+998902{counter:06d}")
            counter += 1

        # ------------------------------------------------------------------
        # Demo wallet top-up codes (kept + a couple more denominations)
        # ------------------------------------------------------------------
        for code, amount, note in [
            ("DEMO5000", 5000, "Demo"),
            ("MIRAEDU", 10000, "Demo"),
            ("DEMO25000", 25000, "Demo — o'rtacha to'lov"),
            ("DEMO100000", 100000, "Demo — katta to'lov"),
        ]:
            TopUpCode.objects.get_or_create(
                code=code,
                defaults={"amount": Decimal(str(amount)), "max_redemptions": 1000, "note": note},
            )

        # ------------------------------------------------------------------
        # Notifications — a few varied ones per student instead of just one
        # ------------------------------------------------------------------
        notif_count = 0
        for u in all_students:
            for title, body in random.sample(NOTIFICATION_TEMPLATES, k=2):
                Notification.objects.get_or_create(
                    user=u, title=title, defaults={"body": body, "link": "/"},
                )
                notif_count += 1

        self.stdout.write(self.style.SUCCESS(f"Notifications created/verified: {notif_count}"))

        # ------------------------------------------------------------------
        # Summary
        # ------------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS("Large demo seed OK"))
        self.stdout.write(
            f"Subjects: {len(subject_by_code)} | Classes: {len(class_groups)} | "
            f"Teachers: {len(teacher_by_username)} | Students: {len(all_students)} | "
            f"Assignments: {assignment_count}"
        )
        self.stdout.write("Logins (password mirae123): superadmin, admin, "
                           + ", ".join(teacher_by_username.keys()) + ", student1.."
                           + str(len(all_students)))

        # ------------------------------------------------------------------
        # NOT seeded here — needs your progress/results model to exist first
        # ------------------------------------------------------------------
        self.stdout.write(self.style.WARNING(
            "\nNOT seeded: test attempts / scores / XP / practical submissions. "
            "This file only used models already shown in your original seed_demo.py "
            "(accounts, schools, assignments, payments, notifications) — there's no "
            "submissions/attempts app imported there, so I don't know its name or "
            "required fields. Tell me that app/model name (and its required fields) "
            "and I'll add realistic mock scores, XP, and per-student progress next."
        ))