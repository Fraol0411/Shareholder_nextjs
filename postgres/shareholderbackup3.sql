--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.2

-- Started on 2026-10-24 09:05:37

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
-- TOC entry 217 (class 1259 OID 143418)
-- Name: activation_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activation_campaigns (
    id integer NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'live'::character varying NOT NULL,
    disabled_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT activation_campaigns_disabled_at_consistency_check CHECK ((((status)::text = 'disabled'::text) = (disabled_at IS NOT NULL))),
    CONSTRAINT activation_campaigns_status_check CHECK (((status)::text = ANY (ARRAY[('live'::character varying)::text, ('disabled'::character varying)::text]))),
    CONSTRAINT campaign_window_check CHECK ((ends_at > starts_at))
);


ALTER TABLE public.activation_campaigns OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 143426)
-- Name: activation_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activation_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activation_campaigns_id_seq OWNER TO postgres;

--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 218
-- Name: activation_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activation_campaigns_id_seq OWNED BY public.activation_campaigns.id;


--
-- TOC entry 219 (class 1259 OID 143427)
-- Name: activations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activations (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character(64) NOT NULL,
    code_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    password_set_at timestamp with time zone,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activations OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 143432)
-- Name: activations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activations_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 220
-- Name: activations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activations_id_seq OWNED BY public.activations.id;


--
-- TOC entry 221 (class 1259 OID 143433)
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
    CONSTRAINT chk_decision_type CHECK (((decision_type)::text = ANY (ARRAY[('withdraw'::character varying)::text, ('fiscalreinvest'::character varying)::text, ('reinvest'::character varying)::text]))),
    CONSTRAINT chk_payment_method CHECK (((payment_method)::text = ANY (ARRAY[('check'::character varying)::text, ('bank-transfer'::character varying)::text]))),
    CONSTRAINT chk_status CHECK (((status)::text = ANY (ARRAY[('rejected'::character varying)::text, ('processed'::character varying)::text, ('pending'::character varying)::text])))
);


ALTER TABLE public.dividend_decisions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 143444)
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
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 222
-- Name: dividend_decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dividend_decisions_id_seq OWNED BY public.dividend_decisions.id;


--
-- TOC entry 223 (class 1259 OID 143445)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    action character varying(150) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 143452)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 224
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 225 (class 1259 OID 143453)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 143457)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 143465)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 227
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 228 (class 1259 OID 143466)
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
    national_id character varying,
    otp character varying(10),
    otp_expires_at timestamp without time zone,
    otp_last_sent_at timestamp without time zone,
    otp_24h_count integer DEFAULT 0 NOT NULL,
    otp_window_start timestamp without time zone,
    otp_failed_attempts integer DEFAULT 0 NOT NULL,
    otp_locked_until timestamp without time zone,
    role_id integer,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('active'::character varying)::text, ('locked'::character varying)::text, ('disabled'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 143477)
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
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 229
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 230 (class 1259 OID 143478)
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
-- TOC entry 231 (class 1259 OID 143485)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value character varying(500) NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by integer
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE system_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.system_settings IS 'Runtime switches an administrator can flip from the dashboard. Read by the API on every gated request, so a change takes effect immediately.';


--
-- TOC entry 232 (class 1259 OID 143491)
-- Name: v_user_permissions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_user_permissions AS
 SELECT u.id AS user_id,
    u.username,
    r.id AS role_id,
    r.name AS role_name,
    p.id AS permission_id,
    p.action AS permission_action,
    p.description AS permission_description
   FROM (((public.users u
     LEFT JOIN public.roles r ON ((r.id = u.role_id)))
     LEFT JOIN public.role_permissions rp ON ((rp.role_id = r.id)))
     LEFT JOIN public.permissions p ON ((p.id = rp.permission_id)));


ALTER VIEW public.v_user_permissions OWNER TO postgres;

--
-- TOC entry 4736 (class 2604 OID 143496)
-- Name: activation_campaigns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_campaigns ALTER COLUMN id SET DEFAULT nextval('public.activation_campaigns_id_seq'::regclass);


--
-- TOC entry 4739 (class 2604 OID 143497)
-- Name: activations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activations ALTER COLUMN id SET DEFAULT nextval('public.activations_id_seq'::regclass);


--
-- TOC entry 4742 (class 2604 OID 143498)
-- Name: dividend_decisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions ALTER COLUMN id SET DEFAULT nextval('public.dividend_decisions_id_seq'::regclass);


--
-- TOC entry 4746 (class 2604 OID 143499)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 4750 (class 2604 OID 143500)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4754 (class 2604 OID 143501)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4956 (class 0 OID 143418)
-- Dependencies: 217
-- Data for Name: activation_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activation_campaigns (id, starts_at, ends_at, created_by, created_at, status, disabled_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4958 (class 0 OID 143427)
-- Dependencies: 219
-- Data for Name: activations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activations (id, campaign_id, user_id, token_hash, code_hash, expires_at, consumed_at, password_set_at, failed_attempts, locked_until, created_at) FROM stdin;
\.


--
-- TOC entry 4960 (class 0 OID 143433)
-- Dependencies: 221
-- Data for Name: dividend_decisions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dividend_decisions (id, file_number, shareholder_name, email, phone, submission_date, fiscal_year, decision_type, amount_to_convert, amount_to_withdraw, payment_method, bank_name, branch_name, account_number, entered_by, status, created_at, user_id, sh_dividend_id) FROM stdin;
\.


--
-- TOC entry 4962 (class 0 OID 143445)
-- Dependencies: 223
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, action, description, created_at, updated_at) FROM stdin;
1	users.view	View staff and admin user accounts	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
2	users.create	Create staff/admin accounts	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
3	users.update	Update staff/admin accounts	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
4	users.delete	Delete staff/admin accounts	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
5	users.reset_password	Reset another user password	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
6	roles.view	View roles	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
7	roles.create	Create roles	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
8	roles.update	Update roles and assigned permissions	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
9	roles.delete	Delete non-system roles	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
10	permissions.view	View permission catalog	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
11	permissions.manage	Create/update permission catalog (admin only)	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
12	shareholders.view	View shareholder registry	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
13	shareholders.create	Add shareholders	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
14	shareholders.update	Update shareholder records	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
15	shareholders.reset_password	Reset shareholder portal password	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
16	dividends.view	View dividend records	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
17	dividends.upload	Bulk upload dividend data	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
18	decisions.view_own	View own dividend decisions	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
19	decisions.submit_own	Submit own dividend decision	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
20	decisions.view_all	View all submitted decisions (basket)	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
21	decisions.submit_behalf	Submit decision on behalf of a shareholder	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
22	decisions.approve	Approve decisions for payment processing	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
23	decisions.reject	Reject decisions	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
24	reports.view	View operational reports	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
25	system.admin	Access system administration areas	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
\.


--
-- TOC entry 4964 (class 0 OID 143453)
-- Dependencies: 225
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id, assigned_at) FROM stdin;
1	1	2026-10-20 15:49:42.276838+03
1	2	2026-10-20 15:49:42.276838+03
1	3	2026-10-20 15:49:42.276838+03
1	4	2026-10-20 15:49:42.276838+03
1	5	2026-10-20 15:49:42.276838+03
1	6	2026-10-20 15:49:42.276838+03
1	7	2026-10-20 15:49:42.276838+03
1	8	2026-10-20 15:49:42.276838+03
1	9	2026-10-20 15:49:42.276838+03
1	10	2026-10-20 15:49:42.276838+03
1	11	2026-10-20 15:49:42.276838+03
1	12	2026-10-20 15:49:42.276838+03
1	13	2026-10-20 15:49:42.276838+03
1	14	2026-10-20 15:49:42.276838+03
1	15	2026-10-20 15:49:42.276838+03
1	16	2026-10-20 15:49:42.276838+03
1	17	2026-10-20 15:49:42.276838+03
1	18	2026-10-20 15:49:42.276838+03
1	19	2026-10-20 15:49:42.276838+03
1	20	2026-10-20 15:49:42.276838+03
1	21	2026-10-20 15:49:42.276838+03
1	22	2026-10-20 15:49:42.276838+03
1	23	2026-10-20 15:49:42.276838+03
1	24	2026-10-20 15:49:42.276838+03
1	25	2026-10-20 15:49:42.276838+03
2	12	2026-10-20 15:49:42.276838+03
2	13	2026-10-20 15:49:42.276838+03
2	14	2026-10-20 15:49:42.276838+03
2	15	2026-10-20 15:49:42.276838+03
2	16	2026-10-20 15:49:42.276838+03
2	17	2026-10-20 15:49:42.276838+03
2	20	2026-10-20 15:49:42.276838+03
2	21	2026-10-20 15:49:42.276838+03
2	24	2026-10-20 15:49:42.276838+03
3	16	2026-10-20 15:49:42.276838+03
4	16	2026-10-20 15:49:42.276838+03
3	18	2026-10-20 15:49:42.276838+03
4	18	2026-10-20 15:49:42.276838+03
3	19	2026-10-20 15:49:42.276838+03
4	19	2026-10-20 15:49:42.276838+03
\.


--
-- TOC entry 4965 (class 0 OID 143457)
-- Dependencies: 226
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, is_system, created_at, updated_at) FROM stdin;
1	admin	Full system administrator	t	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
2	staff	Internal staff / front-desk operator	t	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
3	user	Shareholder portal user	t	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
4	user2	Legacy shareholder role (kept for existing data)	t	2026-10-20 15:49:42.276838+03	2026-10-20 15:49:42.276838+03
\.


--
-- TOC entry 4969 (class 0 OID 143478)
-- Dependencies: 230
-- Data for Name: sh_dividend; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sh_dividend (id, sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, fiscal_year, user_id) FROM stdin;
\.


--
-- TOC entry 4970 (class 0 OID 143485)
-- Dependencies: 231
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (key, value, description, updated_at, updated_by) FROM stdin;
shareholder_data_viewing_note		Optional message shown to shareholders while dividend data viewing is off.	2026-10-21 16:19:40.658042+03	76
shareholder_data_viewing	on	Controls whether shareholders can open their own dividend data. Staff and admins are never affected.	2026-10-23 09:25:41.10128+03	76
\.


--
-- TOC entry 4967 (class 0 OID 143466)
-- Dependencies: 228
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, created_at, updated_at, name, reg_no, sif_no, phone, national_id, otp, otp_expires_at, otp_last_sent_at, otp_24h_count, otp_window_start, otp_failed_attempts, otp_locked_until, role_id, status) FROM stdin;
75	elias	$2b$10$YgDtT6O2FxMFkX25KUd8me2U5WjViKz5.HwND1p.ZiRVU6iSM3VZS	admin	2026-08-24 14:12:10.04423	2026-08-24 14:12:10.04423	\N	elias	\N	\N	\N	\N	\N	\N	0	\N	0	\N	1	active
76	firaol	$2b$10$YgDtT6O2FxMFkX25KUd8me2U5WjViKz5.HwND1p.ZiRVU6iSM3VZS	admin	2026-08-24 14:12:10.04423	2026-08-24 14:12:10.04423	\N	firaol	\N	\N	\N	\N	\N	\N	0	\N	0	\N	1	active
5892	mekdes	$2b$10$oDPeSt9a198AKyPrQ015SerHgK4luZZrvTmx6SvKRqcP569HX6x26	staff	2026-10-23 10:38:31.830027	2026-10-23 10:38:31.830027	\N	mekdes	\N	\N	\N	\N	\N	\N	0	\N	0	\N	2	active
74	ayana	$2b$10$oDPeSt9a198AKyPrQ015SerHgK4luZZrvTmx6SvKRqcP569HX6x26	staff	2026-08-20 16:35:13.909487	2026-08-20 16:35:13.909487	\N	ayana	\N	\N	\N	\N	\N	\N	0	\N	0	\N	2	active
\.


--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 218
-- Name: activation_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activation_campaigns_id_seq', 9, true);


--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 220
-- Name: activations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activations_id_seq', 28718, true);


--
-- TOC entry 4985 (class 0 OID 0)
-- Dependencies: 222
-- Name: dividend_decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dividend_decisions_id_seq', 6, true);


--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 224
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 25, true);


--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 227
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 229
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5892, true);


--
-- TOC entry 4771 (class 2606 OID 143503)
-- Name: activation_campaigns activation_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_campaigns
    ADD CONSTRAINT activation_campaigns_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 143505)
-- Name: activations activations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activations
    ADD CONSTRAINT activations_pkey PRIMARY KEY (id);


--
-- TOC entry 4776 (class 2606 OID 143507)
-- Name: activations activations_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activations
    ADD CONSTRAINT activations_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4780 (class 2606 OID 143509)
-- Name: dividend_decisions dividend_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT dividend_decisions_pkey PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 143511)
-- Name: permissions permissions_action_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_action_key UNIQUE (action);


--
-- TOC entry 4784 (class 2606 OID 143513)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4787 (class 2606 OID 143515)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 4789 (class 2606 OID 143517)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4791 (class 2606 OID 143519)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 143521)
-- Name: sh_dividend sh_dividend_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sh_dividend
    ADD CONSTRAINT sh_dividend_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 143523)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- TOC entry 4794 (class 2606 OID 143525)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4777 (class 1259 OID 143526)
-- Name: idx_activations_campaign_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activations_campaign_id ON public.activations USING btree (campaign_id);


--
-- TOC entry 4778 (class 1259 OID 143527)
-- Name: idx_activations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activations_user_id ON public.activations USING btree (user_id);


--
-- TOC entry 4785 (class 1259 OID 143528)
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- TOC entry 4797 (class 1259 OID 143529)
-- Name: idx_system_settings_updated_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_settings_updated_by ON public.system_settings USING btree (updated_by);


--
-- TOC entry 4792 (class 1259 OID 143530)
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- TOC entry 4772 (class 1259 OID 143531)
-- Name: ux_activation_campaigns_one_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_activation_campaigns_one_live ON public.activation_campaigns USING btree (status) WHERE ((status)::text = 'live'::text);


--
-- TOC entry 4800 (class 2606 OID 143532)
-- Name: activation_campaigns activation_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activation_campaigns
    ADD CONSTRAINT activation_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4801 (class 2606 OID 143537)
-- Name: activations activations_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activations
    ADD CONSTRAINT activations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.activation_campaigns(id) ON DELETE CASCADE;


--
-- TOC entry 4802 (class 2606 OID 143542)
-- Name: activations activations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activations
    ADD CONSTRAINT activations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4803 (class 2606 OID 143547)
-- Name: dividend_decisions dividend_decisions_shdividendId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT "dividend_decisions_shdividendId_fkey" FOREIGN KEY (sh_dividend_id) REFERENCES public.sh_dividend(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4804 (class 2606 OID 143552)
-- Name: dividend_decisions dividend_decisions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dividend_decisions
    ADD CONSTRAINT "dividend_decisions_userId_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4805 (class 2606 OID 143557)
-- Name: role_permissions fk_role_permissions_permission; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 4806 (class 2606 OID 143562)
-- Name: role_permissions fk_role_permissions_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4807 (class 2606 OID 143567)
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- TOC entry 4808 (class 2606 OID 143572)
-- Name: sh_dividend sh_dividend_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sh_dividend
    ADD CONSTRAINT sh_dividend_userid_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 4809 (class 2606 OID 143577)
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-10-24 09:05:38

--
-- PostgreSQL database dump complete
--

