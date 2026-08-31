--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2026-08-27 10:20:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 126475)
-- Name: dividend_decisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dividend_decisions (
    id bigint NOT NULL,
    file_number character varying(50),
    shareholder_name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20),
    submission_date date DEFAULT CURRENT_DATE NOT NULL,
    fiscal_year character varying(10) NOT NULL,
    decision_type character varying(20) NOT NULL,
    amount_to_convert numeric(15,2),
    amount_to_withdraw numeric(15,2),
    payment_method character varying(20),
    bank_name character varying(100),
    branch_name character varying(100),
    account_number character varying(50),
    entered_by bigint,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer,
    sh_dividend_id integer,
    CONSTRAINT chk_decision_type CHECK (((decision_type)::text = ANY ((ARRAY['withdraw'::character varying, 'fiscalreinvest'::character varying, 'reinvest'::character varying])::text[]))),
    CONSTRAINT chk_payment_method CHECK (((payment_method)::text = ANY ((ARRAY['check'::character varying, 'bank-transfer'::character varying])::text[]))),
    CONSTRAINT chk_status CHECK (((status)::text = ANY ((ARRAY['rejected'::character varying, 'processed'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.dividend_decisions OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 126474)
-- Name: dividend_decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dividend_decisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dividend_decisions_id_seq OWNER TO postgres;

--
-- TOC entry 4883 (class 0 OID 0)
-- Dependencies: 217
-- Name: dividend_decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dividend_decisions_id_seq OWNED BY public.dividend_decisions.id;


--
-- TOC entry 220 (class 1259 OID 126490)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    password_hash character varying NOT NULL,
    role character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying,
    reg_no character varying,
    sif_no character varying,
    phone character varying,
    national_id character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 126489)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4884 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 221 (class 1259 OID 126499)
-- Name: sh_dividend; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sh_dividend (
    id integer DEFAULT nextval('public.users_id_seq'::regclass) NOT NULL,
    sn integer NOT NULL,
    paidup_capital numeric NOT NULL,
    dividend_declared numeric NOT NULL,
    dividend_bf numeric DEFAULT 0 NOT NULL,
    total_dividend numeric NOT NULL,
    fiscal_year character varying NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.sh_dividend OWNER TO postgres;

--
-- TOC entry 4704 (class 2604 OID 126478)
-- Name: dividend_decisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions ALTER COLUMN id SET DEFAULT nextval('public.dividend_decisions_id_seq'::regclass);


--
-- TOC entry 4708 (class 2604 OID 126558)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4874 (class 0 OID 126475)
-- Dependencies: 218
-- Data for Name: dividend_decisions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dividend_decisions (id, file_number, shareholder_name, email, phone, submission_date, fiscal_year, decision_type, amount_to_convert, amount_to_withdraw, payment_method, bank_name, branch_name, account_number, entered_by, status, created_at, user_id, sh_dividend_id) FROM stdin;
1	123	Alemayehu Tadese Gemechu	firaoldabi0@gmail.com	+251945242124	2026-08-18	2024/2025	reinvest	\N	\N	\N	\N	\N	\N	1	pending	2026-08-18 16:29:42.085236	\N	\N
3	\N	Ayana Negash	firaoldabi0@gmail.com	929897911	2026-08-21	2024/25	reinvest	\N	\N	\N	\N	\N	\N	\N	pending	2026-08-21 14:23:08.746117	61	62
4	\N	Wako Safay	\N	929897916	2026-08-24	2025/26	reinvest	\N	\N	\N	\N	\N	\N	74	pending	2026-08-24 15:07:39.587758	71	73
5	\N	Firaol Delesa	\N	929897915	2026-08-24	2024/25	withdraw	21.00	200.00	check	\N	\N	\N	\N	pending	2026-08-24 16:18:52.888645	69	75
\.


--
-- TOC entry 4877 (class 0 OID 126499)
-- Dependencies: 221
-- Data for Name: sh_dividend; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sh_dividend (id, sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, fiscal_year, user_id) FROM stdin;
62	1	500	126	100	226	2024/25	61
64	2	500	126	100	226	2024/25	63
66	3	500	126	100	226	2024/25	65
72	6	500	126	100	226	2024/25	71
68	4	500	126	100	226	2024/25	67
75	5	500	126	1000	226	2024/25	69
73	6	500	126	100	226	2025/26	71
\.


--
-- TOC entry 4876 (class 0 OID 126490)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, created_at, updated_at, name, reg_no, sif_no, phone, national_id) FROM stdin;
74	ayana	$2b$10$TFjKDXbsdyvHdOHSGXIuZuSx3bcYOgS49v10bBdhyJV2we31bF4AG	staff	2026-08-20 16:35:13.909487	2026-08-20 16:35:13.909487	\N	\N	\N	\N	\N
65	Firaol Dabi	$2b$10$8swEDi.fgnqgIVBYyy47EuHd1S/zNtfjdD9jzsGpb/96GzH4xc0ba	user	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Firaol Dabi	1201-003	SIF/AHO/22/0005639	929897913	134322332441137
71	Wako Safay	$2b$10$8swEDi.fgnqgIVBYyy47EuHd1S/zNtfjdD9jzsGpb/96GzH4xc0ba	user	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Wako Safay	1201-006	SIF/AHO/22/0005642	929897916	134322332441140
76	admin	$2b$10$YgDtT6O2FxMFkX25KUd8me2U5WjViKz5.HwND1p.ZiRVU6iSM3VZS	admin	2026-08-24 14:12:10.04423	2026-08-24 14:12:10.04423	\N	\N	\N	\N	\N
61	Ayana Negash	$2b$10$h2liPoT9iktO42juGwnOnOSGHSIAHB7vL4sQhCeULfB0xlbB24A8C	user	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Ayana Negash	1201-001	SIF/AHO/22/0005637	929897911	134322332441135
63	Shumi Girma	$2b$10$/P7E/2U5YAkJAjkBK8MMNu3qMv8QsrY7kcqtN0fsLrSPDKyuek9kG	user	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Shumi Girma	1201-002	SIF/AHO/22/0005638	929897912	134322332441136
69	Firaol Delesa	$2b$10$c2.j4rGdHGmjM6/5ZlHSgO.WtOhIPAN9Ovh2o5kFGtCT2oWME/SmG	user	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Firaol Delesa	1201-005	SIF/AHO/22/0005641	929897915	134322332441139
67	Elias Asefa	$2b$10$hlnBCqWtXVWVNs7SNum80.g8hTpay0AweTtD8LEteP0AyBH5YcCRa	admin	2026-08-20 16:25:22.148467	2026-08-21 10:20:53.617334	Elias Asefa	1201-004	SIF/AHO/22/0005640	929897914	134322332441138
\.


--
-- TOC entry 4885 (class 0 OID 0)
-- Dependencies: 217
-- Name: dividend_decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dividend_decisions_id_seq', 5, true);


--
-- TOC entry 4886 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 76, true);


--
-- TOC entry 4718 (class 2606 OID 126488)
-- Name: dividend_decisions dividend_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT dividend_decisions_pkey PRIMARY KEY (id);


--
-- TOC entry 4724 (class 2606 OID 126507)
-- Name: sh_dividend sh_dividend_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sh_dividend
    ADD CONSTRAINT sh_dividend_pkey PRIMARY KEY (id);


--
-- TOC entry 4720 (class 2606 OID 126567)
-- Name: users uq_username; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_username UNIQUE (username);


--
-- TOC entry 4722 (class 2606 OID 126560)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4716 (class 2606 OID 126571)
-- Name: users users_type_check; Type: CHECK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE public.users
    ADD CONSTRAINT users_type_check CHECK (((role)::text = ANY (ARRAY['admin'::text, 'staff'::text, 'user'::text, 'user2'::text]))) NOT VALID;


--
-- TOC entry 4725 (class 2606 OID 126635)
-- Name: dividend_decisions dividend_decisions_shdividendId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT "dividend_decisions_shdividendId_fkey" FOREIGN KEY (sh_dividend_id) REFERENCES public.sh_dividend(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4726 (class 2606 OID 126630)
-- Name: dividend_decisions dividend_decisions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT "dividend_decisions_userId_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4727 (class 2606 OID 126612)
-- Name: sh_dividend sh_dividend_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sh_dividend
    ADD CONSTRAINT sh_dividend_userid_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


-- Completed on 2026-08-27 10:20:43

--
-- PostgreSQL database dump complete
--

