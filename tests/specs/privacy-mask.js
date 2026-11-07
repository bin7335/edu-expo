// 27 가림막: 이름·전화·주민번호·이메일이 가려지고, 규칙을 끄면 다시 보인다
const src = $('#src');
src.value = '김하늘 010-1234-5678 hanul@example.com 150101-3123456\n담임 이바다 선생님 02-345-6789';
fire(src, 'input'); await wait(300);
const out = $('#out').innerText;
assert(!out.includes('1234-5678'), '전화번호 가운데가 가려져야 함: ' + out);
assert(!out.includes('3123456'), '주민번호 뒷자리가 가려져야 함');
assert(!out.includes('hanul@'), '이메일 아이디가 가려져야 함');
assert(!out.includes('김하늘'), '이름이 가려져야 함');
assert(Number($('#total').textContent) >= 4, '가려진 개수 4 이상: ' + $('#total').textContent);
// 전화 규칙을 끄면 전화번호가 그대로 보여야 한다(계좌 규칙이 전화번호를 잘못 잡으면 안 됨)
const phone = $$('#chips input[type=checkbox]').find(c => c.dataset.rule === 'phone');
assert(phone, '전화 규칙 체크박스가 있어야 함');
phone.click(); await wait(300);
assert($('#out').innerText.includes('010-1234-5678'), '전화 규칙을 끄면 전화번호가 보여야 함: ' + $('#out').innerText);
// 계좌번호는 계속 가려짐
src.value = '농협 302-1234-5678-91'; fire(src, 'input'); await wait(300);
assert(!$('#out').innerText.includes('1234-5678'), '계좌번호는 가려져야 함');
// 입력한 태그가 HTML로 해석되지 않음
src.value = '<b>굵게</b> 010-9999-8888'; fire(src, 'input'); await wait(300);
assert(!$('#out').querySelector('b'), '입력한 태그가 HTML로 해석되면 안 됨');
return 'ok';
