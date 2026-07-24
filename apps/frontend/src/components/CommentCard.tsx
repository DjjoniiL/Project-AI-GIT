import { Card, Input } from 'antd';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setComment } from '../features/order/orderSlice';

export function CommentCard() {
  const dispatch = useAppDispatch();
  const comment = useAppSelector((state) => state.order.comment);

  return (
    <Card size="small">
      <label
        htmlFor="comment"
        style={{ display: 'block', marginBottom: 5, fontSize: 12, color: 'var(--ant-color-text-secondary)' }}
      >
        Комментарий
      </label>
      <Input.TextArea
        id="comment"
        rows={1}
        value={comment}
        onChange={(e) => dispatch(setComment(e.target.value))}
        placeholder="Пожелания по печати, отделке или комплектации"
      />
    </Card>
  );
}
